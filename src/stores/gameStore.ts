import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useGameConfig, type GeneratorConfig, type UpgradeConfig } from '../composables/useGameConfig'
import { useGameLoop } from '../composables/useGameLoop'
import { useNarrative } from '../composables/useNarrative'
import { useTaskSystem } from '../composables/useTaskSystem'

export type { GeneratorConfig, UpgradeConfig }

export const useGameStore = defineStore('game', () => {
  // ===== INITIALIZE COMPOSABLES =====
  
  const gameConfig = useGameConfig()
  const gameLoop = useGameLoop()
  
  // Initialize with default config
  const defaultConfig = gameConfig.getDefaultConfig()
  
  // Initialize narrative system with narratives
  const narrativeSystem = useNarrative(defaultConfig.narratives)
  
  // Initialize task system with game loop's current time
  const taskSystem = useTaskSystem(() => gameLoop.currentTime.value)
  
  // ===== BASE GAME STATE =====
  
  // Resources
  const contentUnits = ref(0)
  const lifetimeContentUnits = ref(0)
  
  // Generators (initialized from config)
  const generators = ref<GeneratorConfig[]>(defaultConfig.generators)
  
  // Upgrades (initialized from config)
  const upgrades = ref<UpgradeConfig[]>(defaultConfig.upgrades)
  
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
    return contentUnits.value >= prestigeThreshold.value
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
  function formatContentUnits(amount: number): string {
    // Handle scientific notation for very large numbers
    if (amount >= 1e18) {
      return amount.toExponential(2) + ' HCU'
    }
    
    // Handle quadrillions
    if (amount >= 1e15) {
      return (amount / 1e15).toFixed(2) + 'Q HCU'
    }
    
    // Handle trillions
    if (amount >= 1e12) {
      return (amount / 1e12).toFixed(2) + 'T HCU'
    }
    
    // Handle billions
    if (amount >= 1e9) {
      return (amount / 1e9).toFixed(2) + 'B HCU'
    }
    
    // Handle millions
    if (amount >= 1e6) {
      return (amount / 1e6).toFixed(2) + 'M HCU'
    }
    
    // Handle thousands
    if (amount >= 1e3) {
      return (amount / 1e3).toFixed(2) + 'K HCU'
    }
    
    // Handle smaller numbers with 2 decimals
    return amount.toFixed(2) + ' HCU'
  }
  
  // ===== CORE GAME ACTIONS =====
  
  /**
   * Add content units and track lifetime total
   */
  function addContentUnits(amount: number): void {
    contentUnits.value += amount
    lifetimeContentUnits.value += amount
  }
  
  /**
   * Spend content units if available
   */
  function spendContentUnits(amount: number): boolean {
    if (contentUnits.value >= amount) {
      contentUnits.value -= amount
      return true
    }
    return false
  }
  
  /**
   * Check if player can afford a cost
   */
  function canAfford(amount: number): boolean {
    return contentUnits.value >= amount
  }
  
  // ===== GENERATOR MANAGEMENT =====
  
  /**
   * Get generator by ID
   */
  function getGenerator(id: string): GeneratorConfig | undefined {
    return generators.value.find(g => g.id === id)
  }
  
  /**
   * Calculate generator cost based on owned count
   */
  function getGeneratorCost(generatorId: string): number {
    const generator = generators.value.find(g => g.id === generatorId)
    if (!generator) return 0
    
    // cost_next = cost_base × (rate_growth)^owned
    return Math.floor(generator.baseCost * Math.pow(generator.growthRate, generator.owned))
  }
  
  /**
   * Check if player can purchase generator
   */
  function canPurchaseGenerator(generatorId: string): boolean {
    const cost = getGeneratorCost(generatorId)
    return canAfford(cost)
  }
  
  /**
   * Purchase a generator
   */
  function purchaseGenerator(generatorId: string): boolean {
    const generator = generators.value.find(g => g.id === generatorId)
    if (!generator) return false
    
    const cost = getGeneratorCost(generatorId)
    
    if (canAfford(cost)) {
      if (spendContentUnits(cost)) {
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
  function getGeneratorProductionRate(id: string): number {
    const generator = generators.value.find(g => g.id === id)
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
    return upgrades.value.find(u => u.id === id)
  }
  
  /**
   * Check if upgrade requirements are met
   */
  function areUpgradeRequirementsMet(upgradeId: string): boolean {
    const upgrade = upgrades.value.find(u => u.id === upgradeId)
    if (!upgrade) return false
    
    for (const requirement of upgrade.requirements) {
      const generator = generators.value.find(g => g.id === requirement.generatorId)
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
    const upgrade = upgrades.value.find(u => u.id === upgradeId)
    if (!upgrade) return false
    
    return (
      !upgrade.isPurchased &&
      canAfford(upgrade.cost) &&
      areUpgradeRequirementsMet(upgradeId)
    )
  }
  
  /**
   * Purchase an upgrade
   */
  function purchaseUpgrade(upgradeId: string): boolean {
    const upgrade = upgrades.value.find(u => u.id === upgradeId)
    if (!upgrade) return false
    
    if (!canPurchaseUpgrade(upgradeId)) {
      return false
    }
    
    if (spendContentUnits(upgrade.cost)) {
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
    addContentUnits(clickValue.value)
    
    // Check narrative triggers for content units
    narrativeSystem.triggerNarrative('contentUnits', contentUnits.value)
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
    
    // Reset game state (but keep lifetime HCU)
    contentUnits.value = 0
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
      addContentUnits,
      completeTask: () => taskSystem.completeTask(addContentUnits),
      triggerNarrative: narrativeSystem.triggerNarrative,
      getProductionRate: () => productionRate.value,
      getTaskProgress: () => taskSystem.taskProgress.value,
      getContentUnits: () => contentUnits.value,
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
  
  return {
    // ===== STATE =====
    isRunning: gameLoop.isRunning,
    contentUnits,
    lifetimeContentUnits,
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
    formatContentUnits,
    getGeneratorMultiplier,
    
    // ===== CORE ACTIONS =====
    addContentUnits,
    spendContentUnits,
    canAfford,
    
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
    
    // ===== NARRATIVE SYSTEM =====
    onNarrativeEvent: narrativeSystem.onNarrativeEvent,
    triggerNarrative: narrativeSystem.triggerNarrative,
    getNextPendingEvent: narrativeSystem.getNextPendingEvent,
    hasPendingEvents: narrativeSystem.hasPendingEvents,
  }
}, {
  persist: true
})