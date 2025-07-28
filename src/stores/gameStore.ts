import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generators as generatorConfigs, type GeneratorConfig } from '../config/generators'
import { upgrades as upgradeConfigs, type UpgradeConfig } from '../config/upgrades'
import { currencies, HCU, type CurrencyConfig } from '../config/currencies'
import { narratives, type NarrativeEvent } from '../config/narratives'
import { useGameLoop } from '../composables/useGameLoop'
import { useNarrative } from '../composables/useNarrative'
import { useTaskSystem } from '../composables/useTaskSystem'

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
      return Math.pow(1.25, prestigeLevel.value)
    })

    /**
     * Threshold for prestige eligibility
     */
    const prestigeThreshold = computed(() => {
      return 1000 * Math.pow(10, prestigeLevel.value)
    })

    /**
     * Check if player can prestige
     */
    const canPrestige = computed(() => {
      return getCurrencyAmount(HCU) >= prestigeThreshold.value
    })

    /**
     * Next prestige multiplier preview
     */
    const nextPrestigeMultiplier = computed(() => {
      return Math.pow(1.25, prestigeLevel.value + 1)
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
    function formatCurrency(currency: CurrencyConfig, amount: number): string {
      const unit = ` ${currency.symbol}`

      // Handle scientific notation for very large numbers
      if (amount >= 1e18) {
        return amount.toExponential(2) + unit
      }

      // Handle quadrillions
      if (amount >= 1e15) {
        return (amount / 1e15).toFixed(2) + 'Q' + unit
      }

      // Handle trillions
      if (amount >= 1e12) {
        return (amount / 1e12).toFixed(2) + 'T' + unit
      }

      // Handle billions
      if (amount >= 1e9) {
        return (amount / 1e9).toFixed(2) + 'B' + unit
      }

      // Handle millions
      if (amount >= 1e6) {
        return (amount / 1e6).toFixed(2) + 'M' + unit
      }

      // Handle thousands
      if (amount >= 1e3) {
        return (amount / 1e3).toFixed(2) + 'K' + unit
      }

      // Handle smaller numbers with 2 decimals
      return amount.toFixed(2) + unit
    }

    // ===== CORE GAME ACTIONS =====

    /**
     * Get currency amount by config
     */
    function getCurrencyAmount(currency: CurrencyConfig): number {
      return currencyAmounts.value[currency.id] || 0
    }

    /**
     * Add currency and track lifetime total
     */
    function addCurrency(currency: CurrencyConfig, amount: number): void {
      currencyAmounts.value[currency.id] = (currencyAmounts.value[currency.id] || 0) + amount
      lifetimeCurrencyAmounts.value[currency.id] =
        (lifetimeCurrencyAmounts.value[currency.id] || 0) + amount
    }

    /**
     * Spend currency if available
     */
    function spendCurrency(currency: CurrencyConfig, amount: number): boolean {
      const currentAmount = getCurrencyAmount(currency)
      if (currentAmount >= amount) {
        currencyAmounts.value[currency.id] = currentAmount - amount
        return true
      }
      return false
    }

    /**
     * Check if player can afford a currency cost
     */
    function canAffordCurrency(currency: CurrencyConfig, amount: number): boolean {
      return getCurrencyAmount(currency) >= amount
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
    function getGeneratorCost(generatorConfig: GeneratorConfig): number {
      const generator = generators.value.find((g) => g.id === generatorConfig.id)
      if (!generator) return 0

      // cost_next = cost_base × (rate_growth)^owned
      return Math.floor(generator.baseCost * Math.pow(generator.growthRate, generator.owned))
    }

    /**
     * Check if player can purchase generator
     */
    function canPurchaseGenerator(generatorConfig: GeneratorConfig): boolean {
      const cost = getGeneratorCost(generatorConfig)
      return canAffordCurrency(HCU, cost)
    }

    /**
     * Purchase a generator
     */
    function purchaseGenerator(generatorConfig: GeneratorConfig): boolean {
      const generator = generators.value.find((g) => g.id === generatorConfig.id)
      if (!generator) return false

      const cost = getGeneratorCost(generatorConfig)

      if (canAffordCurrency(HCU, cost)) {
        if (spendCurrency(HCU, cost)) {
          generator.owned++

          // Trigger narrative events for generator purchase
          narrativeSystem.triggerNarrative('generatorPurchase', undefined, generatorConfig.id)

          return true
        }
      }

      return false
    }

    /**
     * Get generator production rate
     */
    function getGeneratorProductionRate(generatorConfig: GeneratorConfig): number {
      const generator = generators.value.find((g) => g.id === generatorConfig.id)
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
    function areUpgradeRequirementsMet(upgradeConfig: UpgradeConfig): boolean {
      const upgrade = upgrades.value.find((u) => u.id === upgradeConfig.id)
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
    function canPurchaseUpgrade(upgradeConfig: UpgradeConfig): boolean {
      const upgrade = upgrades.value.find((u) => u.id === upgradeConfig.id)
      if (!upgrade) return false

      return (
        !upgrade.isPurchased &&
        canAffordCurrency(HCU, upgrade.cost) &&
        areUpgradeRequirementsMet(upgradeConfig)
      )
    }

    /**
     * Purchase an upgrade
     */
    function purchaseUpgrade(upgradeConfig: UpgradeConfig): boolean {
      const upgrade = upgrades.value.find((u) => u.id === upgradeConfig.id)
      if (!upgrade) return false

      if (!canPurchaseUpgrade(upgradeConfig)) {
        return false
      }

      if (spendCurrency(HCU, upgrade.cost)) {
        upgrade.isPurchased = true

        // Trigger narrative events for upgrade purchase
        narrativeSystem.triggerNarrative('upgrade', undefined, upgradeConfig.id)

        return true
      }

      return false
    }

    // ===== PLAYER ACTIONS =====

    /**
     * Manual content generation (clicker mechanic)
     */
    function clickForContent(): void {
      addCurrency(HCU, clickValue.value)

      // Check narrative triggers for content units
      narrativeSystem.triggerNarrative('contentUnits', getCurrencyAmount(HCU))
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
      currencyAmounts.value[HCU.id] = HCU.initialValue
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
        addContentUnits: (amount: number) => addCurrency(HCU, amount),
        completeTask: () => taskSystem.completeTask((amount: number) => addCurrency(HCU, amount)),
        triggerNarrative: narrativeSystem.triggerNarrative,
        getProductionRate: () => productionRate.value,
        getTaskProgress: () => taskSystem.taskProgress.value,
        getContentUnits: () => getCurrencyAmount(HCU),
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

        // Calculate passive income from generators
        const currentProductionRate = productionRate.value
        if (currentProductionRate > 0) {
          const productionThisTick = (currentProductionRate * tickRate) / 1000
          addCurrency(HCU, productionThisTick)
        }

        // Check for task completion and auto-complete
        const taskProgress = taskSystem.taskProgress.value
        if (taskProgress.isComplete) {
          taskSystem.completeTask((amount: number) => addCurrency(HCU, amount))
        }

        // Check narrative triggers based on content units
        const currentContentUnits = getCurrencyAmount(HCU)
        const lastContentUnitsCheck = narrativeSystem.getLastContentUnitsCheck()
        if (Math.floor(currentContentUnits) > Math.floor(lastContentUnitsCheck)) {
          narrativeSystem.triggerNarrative('contentUnits', currentContentUnits)
          narrativeSystem.setLastContentUnitsCheck(currentContentUnits)
        }

        // Check time elapsed triggers
        const gameStartTime = narrativeSystem.getGameStartTime()
        const timeElapsed = gameLoop.currentTime.value - gameStartTime
        narrativeSystem.triggerNarrative('timeElapsed', timeElapsed)
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
      formatCurrency,
      getGeneratorMultiplier,

      // ===== CURRENCY ACTIONS =====
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
