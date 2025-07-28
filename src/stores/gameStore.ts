import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generators as generatorConfigs, type GeneratorConfig } from '../config/generators'
import { upgrades as upgradeConfigs, type UpgradeConfig } from '../config/upgrades'
import { resources, type ResourceConfig } from '../config/resources'
import { narratives, type NarrativeEvent } from '../config/narratives'
import { useGameLoop } from '../composables/useGameLoop'
import { useNarrative } from '../composables/useNarrative'
import { useTaskSystem } from '../composables/useTaskSystem'
import { formatResource } from '../utils/formatters'
import { GAME_CONSTANTS } from '../config/gameConstants'
import { executeGameTick } from '../utils/gameLogic'

export type { GeneratorConfig, UpgradeConfig, NarrativeEvent, ResourceConfig }

// Unified game state interface
interface ResourceState {
  current: number
  lifetime: number
}

interface GameState {
  resources: Record<string, ResourceState>
  generators: GeneratorConfig[]
  upgrades: UpgradeConfig[]
  prestigeLevel: number
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
        resources.map((r) => [r.id, { current: r.initialValue, lifetime: r.initialValue }])
      ),
      generators: generatorConfigs.map((g) => ({ ...g, owned: 0 })),
      upgrades: upgradeConfigs.map((u) => ({ ...u, isPurchased: false })),
      prestigeLevel: 0,
    })

    // ===== COMPUTED PROPERTIES (Auto-cached & Reactive) =====

    /**
     * Global multiplier from prestige system
     */
    const globalMultiplier = computed(() => {
      return Math.pow(GAME_CONSTANTS.PRESTIGE_BASE_MULTIPLIER, gameState.value.prestigeLevel)
    })

    /**
     * Threshold for prestige eligibility
     */
    const prestigeThreshold = computed(() => {
      return (
        GAME_CONSTANTS.PRESTIGE_THRESHOLD_BASE *
        Math.pow(GAME_CONSTANTS.PRESTIGE_THRESHOLD_GROWTH, gameState.value.prestigeLevel)
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
      return Math.pow(GAME_CONSTANTS.PRESTIGE_BASE_MULTIPLIER, gameState.value.prestigeLevel + 1)
    })

    /**
     * Get generator-specific multiplier from upgrades
     */
    const getGeneratorMultiplier = (generatorId: string) => {
      let multiplier = 1
      for (const upgrade of gameState.value.upgrades) {
        if (
          upgrade.isPurchased &&
          upgrade.targetGenerator === generatorId &&
          upgrade.effectType === 'production_multiplier'
        ) {
          multiplier *= upgrade.effectValue
        }
      }
      return multiplier
    }

    /**
     * Total production rate from all generators (includes all multipliers)
     */
    const productionRate = computed(() => {
      let totalRate = 0

      for (const generator of gameState.value.generators) {
        let generatorRate = generator.baseProduction * generator.owned

        // Apply generator-specific upgrade multipliers
        generatorRate *= getGeneratorMultiplier(generator.id)

        totalRate += generatorRate
      }

      // Apply global upgrade multiplier
      let upgradeMultiplier = 1
      for (const upgrade of gameState.value.upgrades) {
        if (upgrade.isPurchased && upgrade.effectType === 'global_multiplier') {
          upgradeMultiplier *= upgrade.effectValue
        }
      }
      totalRate *= upgradeMultiplier

      // Apply prestige multiplier
      totalRate *= globalMultiplier.value

      return totalRate
    })

    /**
     * Click value for manual clicks
     */
    const clickValue = computed(() => {
      return 1 * globalMultiplier.value
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
      
      // Apply maxValue bounds if defined
      if (resourceConfig?.maxValue !== undefined) {
        newAmount = Math.min(newAmount, resourceConfig.maxValue)
      }
      
      gameState.value.resources[resourceId].current = newAmount
      gameState.value.resources[resourceId].lifetime += amount
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
            const decayAmount = currentAmount * resourceConfig.decayRate
            gameState.value.resources[resourceConfig.id].current = Math.max(0, currentAmount - decayAmount)
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
     * Calculate generator cost based on owned count
     */
    function getGeneratorCost(generatorId: string): number {
      const generator = gameState.value.generators.find((g) => g.id === generatorId)
      if (!generator) return 0

      // cost_next = cost_base × (rate_growth)^owned
      return Math.floor(generator.baseCost * Math.pow(generator.growthRate, generator.owned))
    }

    /**
     * Check if player can purchase generator
     */
    function canPurchaseGenerator(generatorId: string): boolean {
      const cost = getGeneratorCost(generatorId)
      return canAffordResource('hcu', cost)
    }

    /**
     * Purchase a generator
     */
    function purchaseGenerator(generatorId: string): boolean {
      const generator = gameState.value.generators.find((g) => g.id === generatorId)
      if (!generator) return false

      const cost = getGeneratorCost(generatorId)

      if (canAffordResource('hcu', cost)) {
        if (spendResource('hcu', cost)) {
          generator.owned++

          // Trigger narrative events for generator purchase
          narrativeSystem.triggerNarrative('generatorPurchase', undefined, generatorId)

          return true
        }
      }

      return false
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
     * Check if upgrade requirements are met
     */
    function areUpgradeRequirementsMet(upgradeId: string): boolean {
      const upgrade = gameState.value.upgrades.find((u) => u.id === upgradeId)
      if (!upgrade) return false

      for (const requirement of upgrade.requirements) {
        const generator = gameState.value.generators.find((g) => g.id === requirement.generatorId)
        if (!generator || generator.owned < requirement.minOwned) {
          return false
        }
      }

      return true
    }

    /**
     * Check if player can purchase upgrade
     */
    function canPurchaseUpgrade(upgradeId: string): boolean {
      const upgrade = gameState.value.upgrades.find((u) => u.id === upgradeId)
      if (!upgrade) return false

      return (
        !upgrade.isPurchased &&
        canAffordResource('hcu', upgrade.cost) &&
        areUpgradeRequirementsMet(upgradeId)
      )
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

      if (spendResource('hcu', upgrade.cost)) {
        upgrade.isPurchased = true

        // Trigger narrative events for upgrade purchase
        narrativeSystem.triggerNarrative('upgrade', undefined, upgradeId)

        return true
      }

      return false
    }

    // ===== PLAYER ACTIONS =====

    /**
     * Manual content generation (clicker mechanic)
     */
    function clickForContent(): void {
      addResource('hcu', clickValue.value)

      // Check narrative triggers for content units
      narrativeSystem.triggerNarrative('contentUnits', getResourceAmount('hcu'))
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
      narrativeSystem.triggerNarrative('prestige', gameState.value.prestigeLevel)

      // Increase prestige level
      gameState.value.prestigeLevel++

      // Reset game state (but keep lifetime resources)
      gameState.value.resources['hcu'].current = 0
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
        addContentUnits: (amount: number) => addResource('hcu', amount),
        completeTask: () => taskSystem.completeTask((amount: number) => addResource('hcu', amount)),
        triggerNarrative: narrativeSystem.triggerNarrative,
        getProductionRate: () => productionRate.value,
        getTaskProgress: () => taskSystem.taskProgress.value,
        getContentUnits: () => getResourceAmount('hcu'),
        getLastContentUnitsCheck: narrativeSystem.getLastContentUnitsCheck,
        setLastContentUnitsCheck: narrativeSystem.setLastContentUnitsCheck,
        getGameStartTime: narrativeSystem.getGameStartTime,
        getCurrentTime: () => gameLoop.currentTime.value,
        hasTriggeredGameStart: narrativeSystem.getHasTriggeredGameStart,
        setHasTriggeredGameStart: narrativeSystem.setHasTriggeredGameStart,
        applyResourceDecay: applyResourceDecay,
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
          addContentUnits: (amount: number) => addResource('hcu', amount),
          completeTask: () =>
            taskSystem.completeTask((amount: number) => addResource('hcu', amount)),
          triggerNarrative: narrativeSystem.triggerNarrative,
          getProductionRate: () => productionRate.value,
          getTaskProgress: () => taskSystem.taskProgress.value,
          getContentUnits: () => getResourceAmount('hcu'),
          getLastContentUnitsCheck: narrativeSystem.getLastContentUnitsCheck,
          setLastContentUnitsCheck: narrativeSystem.setLastContentUnitsCheck,
          getGameStartTime: narrativeSystem.getGameStartTime,
          getCurrentTime: () => gameLoop.currentTime.value,
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
      taskProgress: taskSystem.taskProgress,

      // ===== HELPER FUNCTIONS =====
      formatResource: formatResourceById,
      getGeneratorMultiplier,

      // ===== RESOURCE ACTIONS =====
      getResourceConfig,
      getResourceAmount,
      addResource,
      spendResource,
      canAffordResource,

      // ===== GENERATOR ACTIONS =====
      getGenerator,
      getGeneratorCost,
      canPurchaseGenerator,
      purchaseGenerator,
      getGeneratorProductionRate,

      // ===== UPGRADE ACTIONS =====
      getUpgrade,
      areUpgradeRequirementsMet,
      canPurchaseUpgrade,
      purchaseUpgrade,

      // ===== PLAYER ACTIONS =====
      clickForContent,

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
