import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generators as generatorConfigs, type GeneratorConfig } from '../config/generators'
import { upgrades as upgradeConfigs, type UpgradeConfig } from '../config/upgrades'
import { currencies, type CurrencyConfig } from '../config/currencies'
import { narratives, type NarrativeEvent } from '../config/narratives'
import { useGameLoop } from '../composables/useGameLoop'
import { useNarrative } from '../composables/useNarrative'
import { useTaskSystem } from '../composables/useTaskSystem'
import { formatCurrency } from '../utils/formatters'
import { GAME_CONSTANTS } from '../config/gameConstants'
import { executeGameTick } from '../utils/gameLogic'

export type { GeneratorConfig, UpgradeConfig, NarrativeEvent, CurrencyConfig }

export const useGameStore = defineStore(
  'game',
  () => {
    // ===== INITIALIZE COMPOSABLES =====

    const gameLoop = useGameLoop()

    // Initialize narrative system with narratives
    const narrativeSystem = useNarrative(narratives.map((n) => ({ ...n, isViewed: false })))

    // Initialize task system with game loop's current time
    const taskSystem = useTaskSystem(() => gameLoop.currentTime.value)

    // ===== BASE GAME STATE =====

    // Currencies - initialize from config
    const currencyAmounts = ref<Record<string, number>>(
      Object.fromEntries(currencies.map((c) => [c.id, c.initialValue])),
    )
    const lifetimeCurrencyAmounts = ref<Record<string, number>>(
      Object.fromEntries(currencies.map((c) => [c.id, c.initialValue])),
    )

    // Generators (initialized from config with owned count)
    const generators = ref<GeneratorConfig[]>(generatorConfigs.map((g) => ({ ...g, owned: 0 })))

    // Upgrades (initialized from config with purchased state)
    const upgrades = ref<UpgradeConfig[]>(upgradeConfigs.map((u) => ({ ...u, isPurchased: false })))

    // Prestige
    const prestigeLevel = ref(0)

    // ===== COMPUTED PROPERTIES (Auto-cached & Reactive) =====

    /**
     * Global multiplier from prestige system
     */
    const globalMultiplier = computed(() => {
      return Math.pow(GAME_CONSTANTS.PRESTIGE_BASE_MULTIPLIER, prestigeLevel.value)
    })

    /**
     * Threshold for prestige eligibility
     */
    const prestigeThreshold = computed(() => {
      return (
        GAME_CONSTANTS.PRESTIGE_THRESHOLD_BASE *
        Math.pow(GAME_CONSTANTS.PRESTIGE_THRESHOLD_GROWTH, prestigeLevel.value)
      )
    })

    /**
     * Check if player can prestige
     */
    const canPrestige = computed(() => {
      return getCurrencyAmount('hcu') >= prestigeThreshold.value
    })

    /**
     * Next prestige multiplier preview
     */
    const nextPrestigeMultiplier = computed(() => {
      return Math.pow(GAME_CONSTANTS.PRESTIGE_BASE_MULTIPLIER, prestigeLevel.value + 1)
    })

    /**
     * Get generator-specific multiplier from upgrades
     */
    const getGeneratorMultiplier = (generatorId: string) => {
      let multiplier = 1
      for (const upgrade of upgrades.value) {
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

      for (const generator of generators.value) {
        let generatorRate = generator.baseProduction * generator.owned

        // Apply generator-specific upgrade multipliers
        generatorRate *= getGeneratorMultiplier(generator.id)

        totalRate += generatorRate
      }

      // Apply global upgrade multiplier
      let upgradeMultiplier = 1
      for (const upgrade of upgrades.value) {
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
     * Format currency for display
     */
    function formatCurrencyById(currencyId: string, amount: number): string {
      const currency = getCurrencyConfig(currencyId)
      return formatCurrency(currency, amount)
    }

    // ===== CORE GAME ACTIONS =====

    /**
     * Get currency config by ID
     */
    function getCurrencyConfig(currencyId: string): CurrencyConfig | undefined {
      return currencies.find((c) => c.id === currencyId)
    }

    /**
     * Get currency amount by ID
     */
    function getCurrencyAmount(currencyId: string): number {
      return currencyAmounts.value[currencyId] || 0
    }

    /**
     * Add currency and track lifetime total
     */
    function addCurrency(currencyId: string, amount: number): void {
      currencyAmounts.value[currencyId] = (currencyAmounts.value[currencyId] || 0) + amount
      lifetimeCurrencyAmounts.value[currencyId] =
        (lifetimeCurrencyAmounts.value[currencyId] || 0) + amount
    }

    /**
     * Spend currency if available
     */
    function spendCurrency(currencyId: string, amount: number): boolean {
      const currentAmount = getCurrencyAmount(currencyId)
      if (currentAmount >= amount) {
        currencyAmounts.value[currencyId] = currentAmount - amount
        return true
      }
      return false
    }

    /**
     * Check if player can afford a currency cost
     */
    function canAffordCurrency(currencyId: string, amount: number): boolean {
      return getCurrencyAmount(currencyId) >= amount
    }

    // ===== GENERATOR MANAGEMENT =====

    /**
     * Get generator by ID
     */
    function getGenerator(id: string): GeneratorConfig | undefined {
      return generators.value.find((g) => g.id === id)
    }

    /**
     * Calculate generator cost based on owned count
     */
    function getGeneratorCost(generatorId: string): number {
      const generator = generators.value.find((g) => g.id === generatorId)
      if (!generator) return 0

      // cost_next = cost_base × (rate_growth)^owned
      return Math.floor(generator.baseCost * Math.pow(generator.growthRate, generator.owned))
    }

    /**
     * Check if player can purchase generator
     */
    function canPurchaseGenerator(generatorId: string): boolean {
      const cost = getGeneratorCost(generatorId)
      return canAffordCurrency('hcu', cost)
    }

    /**
     * Purchase a generator
     */
    function purchaseGenerator(generatorId: string): boolean {
      const generator = generators.value.find((g) => g.id === generatorId)
      if (!generator) return false

      const cost = getGeneratorCost(generatorId)

      if (canAffordCurrency('hcu', cost)) {
        if (spendCurrency('hcu', cost)) {
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
      const generator = generators.value.find((g) => g.id === generatorId)
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
      return upgrades.value.find((u) => u.id === id)
    }

    /**
     * Check if upgrade requirements are met
     */
    function areUpgradeRequirementsMet(upgradeId: string): boolean {
      const upgrade = upgrades.value.find((u) => u.id === upgradeId)
      if (!upgrade) return false

      for (const requirement of upgrade.requirements) {
        const generator = generators.value.find((g) => g.id === requirement.generatorId)
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
      const upgrade = upgrades.value.find((u) => u.id === upgradeId)
      if (!upgrade) return false

      return (
        !upgrade.isPurchased &&
        canAffordCurrency('hcu', upgrade.cost) &&
        areUpgradeRequirementsMet(upgradeId)
      )
    }

    /**
     * Purchase an upgrade
     */
    function purchaseUpgrade(upgradeId: string): boolean {
      const upgrade = upgrades.value.find((u) => u.id === upgradeId)
      if (!upgrade) return false

      if (!canPurchaseUpgrade(upgradeId)) {
        return false
      }

      if (spendCurrency('hcu', upgrade.cost)) {
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
      addCurrency('hcu', clickValue.value)

      // Check narrative triggers for content units
      narrativeSystem.triggerNarrative('contentUnits', getCurrencyAmount('hcu'))
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
      narrativeSystem.triggerNarrative('prestige', prestigeLevel.value)

      // Increase prestige level
      prestigeLevel.value++

      // Reset game state (but keep lifetime currencies)
      currencyAmounts.value['hcu'] = 0
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
      for (const generator of generators.value) {
        generator.owned = 0
      }
    }

    /**
     * Reset all upgrade purchases
     */
    function resetUpgrades(): void {
      for (const upgrade of upgrades.value) {
        upgrade.isPurchased = false
      }
    }

    // ===== GAME LOOP INTEGRATION =====

    /**
     * Start the main game loop
     */
    function startGameLoop(): void {
      gameLoop.startGameLoop({
        addContentUnits: (amount: number) => addCurrency('hcu', amount),
        completeTask: () => taskSystem.completeTask((amount: number) => addCurrency('hcu', amount)),
        triggerNarrative: narrativeSystem.triggerNarrative,
        getProductionRate: () => productionRate.value,
        getTaskProgress: () => taskSystem.taskProgress.value,
        getContentUnits: () => getCurrencyAmount('hcu'),
        getLastContentUnitsCheck: narrativeSystem.getLastContentUnitsCheck,
        setLastContentUnitsCheck: narrativeSystem.setLastContentUnitsCheck,
        getGameStartTime: narrativeSystem.getGameStartTime,
        hasTriggeredGameStart: narrativeSystem.getHasTriggeredGameStart,
        setHasTriggeredGameStart: narrativeSystem.setHasTriggeredGameStart,
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
          addContentUnits: (amount: number) => addCurrency('hcu', amount),
          completeTask: () =>
            taskSystem.completeTask((amount: number) => addCurrency('hcu', amount)),
          triggerNarrative: narrativeSystem.triggerNarrative,
          getProductionRate: () => productionRate.value,
          getTaskProgress: () => taskSystem.taskProgress.value,
          getContentUnits: () => getCurrencyAmount('hcu'),
          getLastContentUnitsCheck: narrativeSystem.getLastContentUnitsCheck,
          setLastContentUnitsCheck: narrativeSystem.setLastContentUnitsCheck,
          getGameStartTime: narrativeSystem.getGameStartTime,
          getCurrentTime: () => gameLoop.currentTime.value,
        })
      }
    }

    return {
      // ===== STATE =====
      isRunning: gameLoop.isRunning,
      currencyAmounts,
      lifetimeCurrencyAmounts,
      generators,
      upgrades,
      prestigeLevel,
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
      formatCurrency: formatCurrencyById,
      getGeneratorMultiplier,

      // ===== CURRENCY ACTIONS =====
      getCurrencyConfig,
      getCurrencyAmount,
      addCurrency,
      spendCurrency,
      canAffordCurrency,

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
