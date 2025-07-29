import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  generators as generatorConfigs,
  type GeneratorConfig,
  type ResourceCost,
  type ResourceProduction,
} from '../config/generators'
import type { UnlockCondition } from '../game/unlockSystem'
import { upgrades as upgradeConfigs, type UpgradeConfig } from '../config/upgrades'
import { resources, type ResourceConfig } from '../config/resources'
import { narratives, type NarrativeEvent } from '../config/narratives'
import { useGameLoop } from '../composables/useGameLoop'
import { useNarrative } from '../composables/useNarrative'
import { useTaskSystem } from '../composables/useTaskSystem'
import { GAME_CONSTANTS } from '../config/gameConstants'
import { executeGameTick } from '../game/gameLoop'
import { useResources } from '../composables/useResources'
import { useGenerators } from '../composables/useGenerators'
import { useMultipliers } from '../composables/useMultipliers'
import { UnlockSystem } from '../game/unlockSystem'

export type {
  GeneratorConfig,
  UpgradeConfig,
  NarrativeEvent,
  ResourceConfig,
  UnlockCondition,
  ResourceCost,
  ResourceProduction,
}

// Unified game state interface
interface ResourceState {
  current: number
  lifetime: number
}

export interface GameState {
  resources: Record<string, ResourceState>
  generators: GeneratorConfig[]
  upgrades: UpgradeConfig[]
  narratives: NarrativeEvent[]
  prestige: { level: number }
  gameStartTime?: number
}

export const useGameStore = defineStore(
  'game',
  () => {
    // ===== INITIALIZE COMPOSABLES =====

    const gameLoop = useGameLoop()

    // ===== UNIFIED GAME STATE =====

    const gameState = ref<GameState>({
      resources: Object.fromEntries(
        resources.map((r) => [r.id, { current: r.initialValue, lifetime: r.initialValue }]),
      ),
      generators: generatorConfigs.map((g) => ({ ...g, owned: 0 })),
      upgrades: upgradeConfigs.map((u) => ({ ...u, isPurchased: false })),
      narratives: narratives.map((n) => ({ ...n, isViewed: false })),
      prestige: { level: 0 },
    })

    // Initialize task system with game loop's current time
    const taskSystem = useTaskSystem(() => gameLoop.currentTime.value)

    // ===== COMPUTED PROPERTIES (Auto-cached & Reactive) =====

    /**
     * Global multiplier from prestige system
     */
    const globalMultiplier = computed(() => {
      return Math.pow(GAME_CONSTANTS.PRESTIGE_BASE_MULTIPLIER, gameState.value.prestige.level)
    })

    /**
     * Threshold for prestige eligibility
     */
    const prestigeThreshold = computed(() => {
      return (
        GAME_CONSTANTS.PRESTIGE_THRESHOLD_BASE *
        Math.pow(GAME_CONSTANTS.PRESTIGE_THRESHOLD_GROWTH, gameState.value.prestige.level)
      )
    })

    /**
     * Check if player can prestige
     */
    const canPrestige = computed(() => {
      return resourceSystem.getResourceAmount('hcu') >= prestigeThreshold.value
    })

    /**
     * Next prestige multiplier preview
     */
    const nextPrestigeMultiplier = computed(() => {
      return Math.pow(GAME_CONSTANTS.PRESTIGE_BASE_MULTIPLIER, gameState.value.prestige.level + 1)
    })

    // ===== INITIALIZE MULTIPLIERS AND SYSTEMS =====

    const multiplierSystem = useMultipliers(computed(() => gameState.value))

    const resourceSystem = useResources(computed(() => gameState.value))

    const generatorSystem = useGenerators(
      computed(() => gameState.value),
      {
        canAffordResource: resourceSystem.canAffordResource,
        spendResource: resourceSystem.spendResource,
      },
    )

    // Initialize narrative system with narratives (now that resourceSystem is available)
    const narrativeSystem = useNarrative(
      narratives.map((n) => ({ ...n, isViewed: false })),
      resourceSystem.addResource,
    )

    /**
     * Primary resource production rate (HCU) for display purposes
     */
    const productionRate = computed(() => {
      const resourceProduction = generatorSystem.calculateResourceProduction()
      const finalProduction = resourceSystem.applyGlobalMultipliers(resourceProduction)
      return generatorSystem.getHCUProductionRate(finalProduction)
    })

    /**
     * Apply resource production from all generators for one tick
     */
    function applyResourceProduction(): void {
      const baseProduction = generatorSystem.calculateResourceProduction()
      resourceSystem.applyResourceProduction(baseProduction)
    }

    /**
     * Click rewards for manual clicks - returns array of resource rewards
     */
    const clickRewards = computed(() => {
      const clickMult = multiplierSystem.getClickMultiplier()
      return GAME_CONSTANTS.CLICK_REWARDS.map((reward) => ({
        resourceId: reward.resourceId,
        amount: reward.amount * globalMultiplier.value * clickMult,
      }))
    })

    /**
     * Click value (primary reward amount for display purposes)
     */
    const clickValue = computed(() => {
      const primaryReward = clickRewards.value[0]
      return primaryReward ? primaryReward.amount : 0
    })

    // ===== GENERATOR MANAGEMENT (delegated to composable) =====

    /**
     * Purchase a generator with narrative integration
     */
    function purchaseGenerator(generatorId: string): boolean {
      const success = generatorSystem.purchaseGenerator(generatorId)
      if (success) {
        // Check narrative events after generator purchase
        narrativeSystem.checkAndTriggerNarratives(gameState.value)
      }
      return success
    }

    // ===== UPGRADE MANAGEMENT =====

    /**
     * Get upgrade by ID
     */
    function getUpgrade(id: string): UpgradeConfig | undefined {
      return gameState.value.upgrades.find((u) => u.id === id)
    }

    /**
     * Check if upgrade unlock conditions are met
     */
    function areUpgradeRequirementsMet(upgradeId: string): boolean {
      const upgrade = gameState.value.upgrades.find((u) => u.id === upgradeId)
      if (!upgrade) return false

      const result = UnlockSystem.checkConditions(upgrade.unlockConditions || [], gameState.value)
      return result.isUnlocked
    }

    /**
     * Check if player can purchase upgrade
     */
    function canPurchaseUpgrade(upgradeId: string): boolean {
      const upgrade = gameState.value.upgrades.find((u) => u.id === upgradeId)
      if (!upgrade) return false

      if (upgrade.isPurchased) return false

      // Check if player can afford all resource costs
      for (const cost of upgrade.costs) {
        if (!resourceSystem.canAffordResource(cost.resourceId, cost.amount)) {
          return false
        }
      }

      return areUpgradeRequirementsMet(upgradeId)
    }

    /**
     * Purchase an upgrade
     */
    function purchaseUpgrade(upgradeId: string): boolean {
      const upgrade = gameState.value.upgrades.find((u) => u.id === upgradeId)
      if (!upgrade) return false

      if (!canPurchaseUpgrade(upgradeId)) {
        return false
      }

      // Spend all required resources
      for (const cost of upgrade.costs) {
        if (!resourceSystem.spendResource(cost.resourceId, cost.amount)) {
          // This shouldn't happen if canPurchaseUpgrade worked correctly
          return false
        }
      }

      upgrade.isPurchased = true

      // Check narrative events after upgrade purchase
      narrativeSystem.checkAndTriggerNarratives(gameState.value)

      return true
    }

    // ===== PLAYER ACTIONS =====

    /**
     * Manual resource generation (clicker mechanic)
     */
    function clickForResources(): void {
      // Apply all configured click rewards
      for (const reward of clickRewards.value) {
        resourceSystem.addResource(reward.resourceId, reward.amount)
      }

      // Check narrative events after click rewards
      narrativeSystem.checkAndTriggerNarratives(gameState.value)
    }

    // ===== PRESTIGE SYSTEM =====

    /**
     * Perform prestige reset
     */
    function performPrestige(): boolean {
      if (!canPrestige.value) {
        return false
      }

      // Check narrative events after prestige
      narrativeSystem.checkAndTriggerNarratives(gameState.value)

      // Increase prestige level
      gameState.value.prestige.level++

      // Reset all resources to initial values (but keep lifetime totals)
      for (const resource of resources) {
        if (gameState.value.resources[resource.id]) {
          gameState.value.resources[resource.id].current = resource.initialValue
        }
      }

      generatorSystem.resetGenerators()
      resetUpgrades()

      // Reset narrative system for prestige
      narrativeSystem.resetForPrestige()

      return true
    }

    /**
     * Reset all upgrade purchases
     */
    function resetUpgrades(): void {
      for (const upgrade of gameState.value.upgrades) {
        upgrade.isPurchased = false
      }
    }

    // ===== GAME LOOP INTEGRATION =====

    /**
     * Start the main game loop
     */
    function startGameLoop(): void {
      gameLoop.startGameLoop({
        addResource: resourceSystem.addResource,
        completeTask: () => taskSystem.completeTask(resourceSystem.addResource),
        checkAndTriggerNarratives: narrativeSystem.checkAndTriggerNarratives,
        getTaskProgress: () => taskSystem.taskProgress.value,
        getResourceAmount: resourceSystem.getResourceAmount,
        getGameStartTime: narrativeSystem.getGameStartTime,
        getCurrentTime: () => gameLoop.currentTime.value,
        applyResourceDecay: resourceSystem.applyResourceDecay,
        applyResourceProduction: applyResourceProduction,
        getGameState: () => gameState.value,
      })
    }

    /**
     * Stop the main game loop
     */
    function stopGameLoop(): void {
      gameLoop.stopGameLoop()
    }

    /**
     * Advance the game loop programmatically for testing or UI features
     */
    function advanceGameLoop(ticks: number): void {
      for (let i = 0; i < ticks; i++) {
        // Update time (simulate time passage)
        const tickRate = gameLoop.tickRate
        gameLoop.currentTime.value += tickRate

        // Execute shared game tick logic
        executeGameTick({
          addResource: resourceSystem.addResource,
          completeTask: () => taskSystem.completeTask(resourceSystem.addResource),
          checkAndTriggerNarratives: narrativeSystem.checkAndTriggerNarratives,
          getTaskProgress: () => taskSystem.taskProgress.value,
          getResourceAmount: resourceSystem.getResourceAmount,
          getGameStartTime: narrativeSystem.getGameStartTime,
          getCurrentTime: () => gameLoop.currentTime.value,
          applyResourceProduction: applyResourceProduction,
          getGameState: () => gameState.value,
        })

        // Apply currency decay for depletable resources
        resourceSystem.applyResourceDecay()
      }
    }

    return {
      // ===== STATE =====
      isRunning: gameLoop.isRunning,
      gameState,
      narrative: narrativeSystem.narrative,
      taskStartTime: taskSystem.taskStartTime,

      // ===== COMPUTED PROPERTIES =====
      globalMultiplier,
      prestigeThreshold,
      canPrestige,
      nextPrestigeMultiplier,
      productionRate,
      clickValue,
      clickRewards,
      taskProgress: taskSystem.taskProgress,

      // ===== COMPOSABLE SYSTEMS (for direct component access) =====
      resourceSystem,
      generatorSystem,
      multiplierSystem,

      // ===== HIGH-LEVEL ACTIONS (orchestration) =====
      purchaseGenerator,

      // ===== UPGRADE ACTIONS =====
      getUpgrade,
      areUpgradeRequirementsMet,
      canPurchaseUpgrade,
      purchaseUpgrade,

      // ===== PLAYER ACTIONS =====
      clickForResources,

      // ===== PRESTIGE ACTIONS =====
      performPrestige,
      resetGenerators: generatorSystem.resetGenerators,
      resetUpgrades,

      // ===== GAME LOOP =====
      startGameLoop,
      stopGameLoop,
      advanceGameLoop,
      tickRate: gameLoop.tickRate,

      // ===== NARRATIVE SYSTEM =====
      onNarrativeEvent: narrativeSystem.onNarrativeEvent,
      checkAndTriggerNarratives: narrativeSystem.checkAndTriggerNarratives,
      getNextPendingEvent: narrativeSystem.getNextPendingEvent,
      hasPendingEvents: narrativeSystem.hasPendingEvents,
    }
  },
  {
    persist: true,
  },
)
