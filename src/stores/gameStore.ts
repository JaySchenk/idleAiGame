import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  generators as generatorConfigs,
  type GeneratorConfig,
  type ResourceCost,
  type ResourceProduction,
} from '../config/generators'
import type { UnlockCondition } from '../utils/unlockSystem'
import { upgrades as upgradeConfigs, type UpgradeConfig } from '../config/upgrades'
import { resources, type ResourceConfig } from '../config/resources'
import { narratives, type NarrativeEvent } from '../config/narratives'
import { useGameLoop } from '../composables/useGameLoop'
import { useNarrative } from '../composables/useNarrative'
import { useTaskSystem } from '../composables/useTaskSystem'
import { formatResource } from '../utils/formatters'
import { GAME_CONSTANTS } from '../config/gameConstants'
import { executeGameTick } from '../utils/gameLogic'
import {
  calculateResourceProduction,
  applyGlobalMultipliers,
  getHCUProductionRate,
} from '../game/Generators'
import { UnlockSystem } from '../utils/unlockSystem'

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

    // Initialize narrative system with narratives
    const narrativeSystem = useNarrative(narratives.map((n) => ({ ...n, isViewed: false })))

    // Initialize task system with game loop's current time
    const taskSystem = useTaskSystem(() => gameLoop.currentTime.value)

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
      return getResourceAmount('hcu') >= prestigeThreshold.value
    })

    /**
     * Next prestige multiplier preview
     */
    const nextPrestigeMultiplier = computed(() => {
      return Math.pow(GAME_CONSTANTS.PRESTIGE_BASE_MULTIPLIER, gameState.value.prestige.level + 1)
    })

    /**
     * Get generator-specific multiplier from upgrades
     */
    const getGeneratorMultiplier = (generatorId: string) => {
      let multiplier = 1
      for (const upgrade of gameState.value.upgrades) {
        if (upgrade.isPurchased) {
          for (const effect of upgrade.effects) {
            if (effect.type === 'production_multiplier' && effect.targetId === generatorId) {
              multiplier *= effect.value
            }
          }
        }
      }
      return multiplier
    }

    /**
     * Get click multiplier from upgrades
     */
    const getClickMultiplier = () => {
      let multiplier = 1
      for (const upgrade of gameState.value.upgrades) {
        if (upgrade.isPurchased) {
          for (const effect of upgrade.effects) {
            if (effect.type === 'click_multiplier') {
              multiplier *= effect.value
            }
          }
        }
      }
      return multiplier
    }

    /**
     * Get resource-specific global multiplier from upgrades
     */
    const getGlobalResourceMultiplier = (resourceId: string) => {
      let multiplier = 1
      for (const upgrade of gameState.value.upgrades) {
        if (upgrade.isPurchased) {
          for (const effect of upgrade.effects) {
            if (effect.type === 'global_resource_multiplier' && effect.targetId === resourceId) {
              multiplier *= effect.value
            }
          }
        }
      }
      return multiplier
    }

    /**
     * Get resource capacity modification from upgrades
     */
    const getResourceCapacityModification = (resourceId: string) => {
      let modification = 0
      for (const upgrade of gameState.value.upgrades) {
        if (upgrade.isPurchased) {
          for (const effect of upgrade.effects) {
            if (effect.type === 'resource_capacity' && effect.targetId === resourceId) {
              modification += effect.value
            }
          }
        }
      }
      return modification
    }

    /**
     * Get decay rate multiplier from upgrades
     */
    const getDecayRateMultiplier = (resourceId: string) => {
      let multiplier = 1
      for (const upgrade of gameState.value.upgrades) {
        if (upgrade.isPurchased) {
          for (const effect of upgrade.effects) {
            if (effect.type === 'decay_reduction' && effect.targetId === resourceId) {
              multiplier *= effect.value
            }
          }
        }
      }
      return multiplier
    }

    /**
     * Primary resource production rate (HCU) for display purposes
     */
    const productionRate = computed(() => {
      return getHCUProductionRate(gameState.value, getGeneratorMultiplier, getGlobalResourceMultiplier)
    })

    /**
     * Get production rate for a specific resource (includes production, consumption, and decay)
     */
    function getResourceProductionRate(resourceId: string): number {
      // Get base generator production/consumption
      const baseProduction = calculateResourceProduction(gameState.value, getGeneratorMultiplier)
      const finalProduction = applyGlobalMultipliers(baseProduction, gameState.value, getGlobalResourceMultiplier)
      let netRate = finalProduction.get(resourceId) || 0

      // Add natural decay for depletable resources
      const resourceConfig = getResourceConfig(resourceId)
      if (resourceConfig && resourceConfig.isDepletable && resourceConfig.decayRate) {
        const currentAmount = getResourceAmount(resourceId)
        const decayMultiplier = getDecayRateMultiplier(resourceId)
        const decayRate = currentAmount * resourceConfig.decayRate * decayMultiplier
        netRate -= decayRate
      }

      return netRate
    }

    /**
     * Apply resource production from all generators for one tick
     */
    function applyResourceProduction(): void {
      const baseProduction = calculateResourceProduction(gameState.value, getGeneratorMultiplier)
      const finalProduction = applyGlobalMultipliers(baseProduction, gameState.value, getGlobalResourceMultiplier)

      // Apply the production changes (scaled for tick rate)
      const tickMultiplier = GAME_CONSTANTS.TICK_RATE / 1000

      for (const [resourceId, change] of finalProduction) {
        const changeThisTick = change * tickMultiplier
        if (changeThisTick !== 0) {
          addResource(resourceId, changeThisTick)
        }
      }
    }

    /**
     * Click rewards for manual clicks - returns array of resource rewards
     */
    const clickRewards = computed(() => {
      const clickMult = getClickMultiplier()
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

    // ===== HELPER FUNCTIONS =====

    /**
     * Format resource for display
     */
    function formatResourceById(resourceId: string, amount: number): string {
      const resource = getResourceConfig(resourceId)
      return formatResource(resource, amount)
    }

    // ===== CORE GAME ACTIONS =====

    /**
     * Get resource config by ID
     */
    function getResourceConfig(resourceId: string): ResourceConfig | undefined {
      return resources.find((r) => r.id === resourceId)
    }

    /**
     * Get resource amount by ID
     */
    function getResourceAmount(resourceId: string): number {
      return gameState.value.resources[resourceId]?.current || 0
    }

    /**
     * Add resource and track lifetime total
     */
    function addResource(resourceId: string, amount: number): void {
      if (!gameState.value.resources[resourceId]) {
        gameState.value.resources[resourceId] = { current: 0, lifetime: 0 }
      }

      const resourceConfig = getResourceConfig(resourceId)
      const currentAmount = gameState.value.resources[resourceId].current
      let newAmount = currentAmount + amount

      // Apply maxValue bounds if defined (including capacity modifications)
      if (resourceConfig?.maxValue !== undefined) {
        const capacityModification = getResourceCapacityModification(resourceId)
        const effectiveMaxValue = resourceConfig.maxValue + capacityModification
        newAmount = Math.min(newAmount, Math.max(0, effectiveMaxValue))
      }

      // Ensure non-negative values for non-depletable resources
      if (resourceConfig && !resourceConfig.isDepletable && newAmount < 0) {
        newAmount = 0
      }

      gameState.value.resources[resourceId].current = newAmount
      gameState.value.resources[resourceId].lifetime += Math.max(0, amount)
    }

    /**
     * Spend resource if available
     */
    function spendResource(resourceId: string, amount: number): boolean {
      const currentAmount = getResourceAmount(resourceId)
      if (currentAmount >= amount) {
        gameState.value.resources[resourceId].current = currentAmount - amount
        return true
      }
      return false
    }

    /**
     * Check if player can afford a resource cost
     */
    function canAffordResource(resourceId: string, amount: number): boolean {
      return getResourceAmount(resourceId) >= amount
    }

    /**
     * Apply resource decay for depletable resources
     */
    function applyResourceDecay(): void {
      for (const resourceConfig of resources) {
        if (resourceConfig.isDepletable && resourceConfig.decayRate) {
          const currentAmount = getResourceAmount(resourceConfig.id)
          if (currentAmount > 0) {
            const decayMultiplier = getDecayRateMultiplier(resourceConfig.id)
            const decayAmount = currentAmount * resourceConfig.decayRate * decayMultiplier
            gameState.value.resources[resourceConfig.id].current = Math.max(
              0,
              currentAmount - decayAmount,
            )
          }
        }
      }
    }

    // ===== GENERATOR MANAGEMENT =====

    /**
     * Get generator by ID
     */
    function getGenerator(id: string): GeneratorConfig | undefined {
      return gameState.value.generators.find((g) => g.id === id)
    }

    /**
     * Calculate generator cost based on owned count - returns array of resource costs
     */
    function getGeneratorCost(generatorId: string): ResourceCost[] {
      const generator = gameState.value.generators.find((g) => g.id === generatorId)
      if (!generator) return []

      // cost_next = cost_base × (rate_growth)^owned
      return generator.baseCost.map((cost) => ({
        resourceId: cost.resourceId,
        amount: Math.floor(cost.amount * Math.pow(generator.costGrowthRate, generator.owned)),
      }))
    }

    /**
     * Calculate primary resource cost (HCU) for display purposes
     */
    function getGeneratorHCUCost(generatorId: string): number {
      const costs = getGeneratorCost(generatorId)
      const hcuCost = costs.find((cost) => cost.resourceId === 'hcu')
      return hcuCost ? hcuCost.amount : 0
    }

    /**
     * Check if player can purchase generator
     */
    function canPurchaseGenerator(generatorId: string): boolean {
      const costs = getGeneratorCost(generatorId)

      // Check if player can afford all resource costs
      for (const cost of costs) {
        if (!canAffordResource(cost.resourceId, cost.amount)) {
          return false
        }
      }

      // Check unlock conditions
      return checkUnlockConditions(generatorId)
    }

    /**
     * Check if generator unlock conditions are met
     */
    function checkUnlockConditions(generatorId: string): boolean {
      const generator = gameState.value.generators.find((g) => g.id === generatorId)
      if (!generator) return false
      
      const currentGameState: GameState = {
        resources: gameState.value.resources,
        generators: gameState.value.generators,
        upgrades: gameState.value.upgrades,
        narratives: gameState.value.narratives,
        prestige: gameState.value.prestige,
        gameStartTime: gameState.value.gameStartTime
      }
      
      const result = UnlockSystem.checkConditions(generator.unlockConditions || [], currentGameState)
      return result.isUnlocked
    }

    /**
     * Purchase a generator
     */
    function purchaseGenerator(generatorId: string): boolean {
      const generator = gameState.value.generators.find((g) => g.id === generatorId)
      if (!generator) return false

      // Check if we can afford all costs and meet unlock conditions
      if (!canPurchaseGenerator(generatorId)) {
        return false
      }

      const costs = getGeneratorCost(generatorId)

      // Spend all required resources
      for (const cost of costs) {
        if (!spendResource(cost.resourceId, cost.amount)) {
          // This shouldn't happen if canPurchaseGenerator worked correctly
          return false
        }
      }

      generator.owned++

      // Trigger narrative events for generator purchase
      narrativeSystem.triggerNarrative('generatorPurchase', undefined, generatorId)

      return true
    }

    /**
     * Get generator production rate
     */
    function getGeneratorProductionRate(generatorId: string): number {
      const generator = gameState.value.generators.find((g) => g.id === generatorId)
      if (!generator) return 0

      let rate = generator.baseProduction * generator.owned
      rate *= getGeneratorMultiplier(generator.id)

      return rate
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

      const currentGameState: GameState = {
        resources: gameState.value.resources,
        generators: gameState.value.generators,
        upgrades: gameState.value.upgrades,
        narratives: gameState.value.narratives,
        prestige: gameState.value.prestige,
        gameStartTime: gameState.value.gameStartTime
      }
      
      const result = UnlockSystem.checkConditions(upgrade.unlockConditions || [], currentGameState)
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
        if (!canAffordResource(cost.resourceId, cost.amount)) {
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
        if (!spendResource(cost.resourceId, cost.amount)) {
          // This shouldn't happen if canPurchaseUpgrade worked correctly
          return false
        }
      }

      upgrade.isPurchased = true

      // Trigger narrative events for upgrade purchase
      narrativeSystem.triggerNarrative('upgrade', undefined, upgradeId)

      return true
    }

    // ===== PLAYER ACTIONS =====

    /**
     * Manual resource generation (clicker mechanic)
     */
    function clickForResources(): void {
      // Apply all configured click rewards
      for (const reward of clickRewards.value) {
        addResource(reward.resourceId, reward.amount)
      }

      // Check narrative triggers for all resources that were rewarded
      for (const reward of clickRewards.value) {
        const resourceAmount = getResourceAmount(reward.resourceId)
        narrativeSystem.triggerNarrative('resourceAmount', resourceAmount, reward.resourceId)
      }
    }

    // ===== PRESTIGE SYSTEM =====

    /**
     * Perform prestige reset
     */
    function performPrestige(): boolean {
      if (!canPrestige.value) {
        return false
      }

      // Trigger narrative events for prestige
      narrativeSystem.triggerNarrative('prestige', gameState.value.prestige.level)

      // Increase prestige level
      gameState.value.prestige.level++

      // Reset all resources to initial values (but keep lifetime totals)
      for (const resource of resources) {
        if (gameState.value.resources[resource.id]) {
          gameState.value.resources[resource.id].current = resource.initialValue
        }
      }

      resetGenerators()
      resetUpgrades()

      // Reset narrative system for prestige
      narrativeSystem.resetForPrestige()

      return true
    }

    /**
     * Reset all generator owned counts
     */
    function resetGenerators(): void {
      for (const generator of gameState.value.generators) {
        generator.owned = 0
      }
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
        addResource: addResource,
        completeTask: () => taskSystem.completeTask(addResource),
        triggerNarrative: narrativeSystem.triggerNarrative,
        getTaskProgress: () => taskSystem.taskProgress.value,
        getResourceAmount: getResourceAmount,
        getLastContentUnitsCheck: narrativeSystem.getLastContentUnitsCheck,
        setLastContentUnitsCheck: narrativeSystem.setLastContentUnitsCheck,
        getGameStartTime: narrativeSystem.getGameStartTime,
        getCurrentTime: () => gameLoop.currentTime.value,
        hasTriggeredGameStart: narrativeSystem.getHasTriggeredGameStart,
        setHasTriggeredGameStart: narrativeSystem.setHasTriggeredGameStart,
        applyResourceDecay: applyResourceDecay,
        applyResourceProduction: applyResourceProduction,
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
          addResource: addResource,
          completeTask: () => taskSystem.completeTask(addResource),
          triggerNarrative: narrativeSystem.triggerNarrative,
          getTaskProgress: () => taskSystem.taskProgress.value,
          getResourceAmount: getResourceAmount,
          getLastContentUnitsCheck: narrativeSystem.getLastContentUnitsCheck,
          setLastContentUnitsCheck: narrativeSystem.setLastContentUnitsCheck,
          getGameStartTime: narrativeSystem.getGameStartTime,
          getCurrentTime: () => gameLoop.currentTime.value,
          applyResourceProduction: applyResourceProduction,
        })

        // Apply currency decay for depletable resources
        applyResourceDecay()
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

      // ===== HELPER FUNCTIONS =====
      formatResource: formatResourceById,
      getGeneratorMultiplier,
      getClickMultiplier,
      getGlobalResourceMultiplier,
      getResourceCapacityModification,
      getDecayRateMultiplier,

      // ===== RESOURCE ACTIONS =====
      getResourceConfig,
      getResourceAmount,
      getResourceProductionRate,
      addResource,
      spendResource,
      canAffordResource,

      // ===== GENERATOR ACTIONS =====
      getGenerator,
      getGeneratorCost,
      getGeneratorHCUCost,
      canPurchaseGenerator,
      purchaseGenerator,
      getGeneratorProductionRate,
      checkUnlockConditions,

      // ===== RESOURCE UNLOCK CHECKS =====
      checkResourceUnlocked: (resourceId: string): boolean => {
        const resourceConfig = getResourceConfig(resourceId)
        if (!resourceConfig || !resourceConfig.unlockConditions) return true
        
        const currentGameState: GameState = {
          resources: gameState.value.resources,
          generators: gameState.value.generators,
          upgrades: gameState.value.upgrades,
          narratives: gameState.value.narratives,
          prestige: gameState.value.prestige,
          gameStartTime: gameState.value.gameStartTime
        }
        
        const result = UnlockSystem.checkConditions(resourceConfig.unlockConditions, currentGameState)
        return result.isUnlocked
      },

      // ===== NARRATIVE UNLOCK CHECKS =====
      checkNarrativeUnlocked: (narrativeId: string): boolean => {
        const narrative = gameState.value.narratives.find(n => n.id === narrativeId)
        if (!narrative || !narrative.unlockConditions) return true
        
        const currentGameState: GameState = {
          resources: gameState.value.resources,
          generators: gameState.value.generators,
          upgrades: gameState.value.upgrades,
          narratives: gameState.value.narratives,
          prestige: gameState.value.prestige,
          gameStartTime: gameState.value.gameStartTime
        }
        
        const result = UnlockSystem.checkConditions(narrative.unlockConditions, currentGameState)
        return result.isUnlocked
      },

      // ===== UPGRADE ACTIONS =====
      getUpgrade,
      areUpgradeRequirementsMet,
      canPurchaseUpgrade,
      purchaseUpgrade,

      // ===== PLAYER ACTIONS =====
      clickForResources,

      // ===== PRESTIGE ACTIONS =====
      performPrestige,
      resetGenerators,
      resetUpgrades,

      // ===== GAME LOOP =====
      startGameLoop,
      stopGameLoop,
      advanceGameLoop,
      tickRate: gameLoop.tickRate,

      // ===== NARRATIVE SYSTEM =====
      onNarrativeEvent: narrativeSystem.onNarrativeEvent,
      triggerNarrative: narrativeSystem.triggerNarrative,
      getNextPendingEvent: narrativeSystem.getNextPendingEvent,
      hasPendingEvents: narrativeSystem.hasPendingEvents,
    }
  },
  {
    persist: true,
  },
)
