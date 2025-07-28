import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { NarrativeEvent } from '../assets/narratives'
import generatorsConfig from '../../config/generators.json'
import upgradesConfig from '../../config/upgrades.json'
import narrativesConfig from '../../config/narratives.json'

export interface GeneratorConfig {
  id: string
  name: string
  baseCost: number
  growthRate: number
  baseProduction: number
  owned: number
}

export interface UpgradeConfig {
  id: string
  name: string
  description: string
  cost: number
  targetGenerator: string
  effectType: 'production_multiplier' | 'global_multiplier'
  effectValue: number
  requirements: {
    generatorId: string
    minOwned: number
  }[]
  isPurchased: boolean
}

export const useGameStore = defineStore('game', () => {
  // ===== BASE STATE =====
  
  // Game control
  const isRunning = ref(false)
  
  // Resources
  const contentUnits = ref(0)
  const lifetimeContentUnits = ref(0)
  
  // Generators
  const generators = ref<GeneratorConfig[]>(
    generatorsConfig.map(config => ({
      ...config,
      owned: 0,
    }))
  )
  
  // Upgrades
  const upgrades = ref<UpgradeConfig[]>(
    upgradesConfig.map(config => ({
      ...config,
      effectType: config.effectType as 'production_multiplier' | 'global_multiplier',
      isPurchased: false,
    }))
  )
  
  // Prestige
  const prestigeLevel = ref(0)
  
  // Narrative state
  const narrative = ref({
    currentStoryEvents: narrativesConfig.map(config => ({
      ...config,
      triggerType: config.triggerType as 'gameStart' | 'contentUnits' | 'generatorPurchase' | 'upgrade' | 'prestige' | 'timeElapsed',
      isViewed: false
    })) as NarrativeEvent[],
    viewedEvents: [] as string[],
    societalStability: 100,
    pendingEvents: [] as NarrativeEvent[],
    isNarrativeActive: false,
    gameStartTime: Date.now(),
  })
  
  // Task system constants
  const taskDuration = 30000
  const taskReward = 10
  const taskStartTime = ref(Date.now()) // Will be restored from persistence if available
  const currentTime = ref(Date.now())
  
  // Narrative tracking
  const hasTriggeredGameStart = ref(false)
  const lastContentUnitsCheck = ref(0)
  const eventCallbacks = ref<((event: NarrativeEvent) => void)[]>([])
  
  // Game loop control
  let gameLoop: number | null = null
  
  // ===== COMPUTED PROPERTIES (Auto-cached & Reactive) =====
  
  // Global multiplier from prestige
  const globalMultiplier = computed(() => {
    return Math.pow(1.25, prestigeLevel.value)
  })
  
  // Prestige threshold calculation
  const prestigeThreshold = computed(() => {
    return 1000 * Math.pow(10, prestigeLevel.value)
  })
  
  // Can prestige check
  const canPrestige = computed(() => {
    return contentUnits.value >= prestigeThreshold.value
  })
  
  // Next prestige multiplier
  const nextPrestigeMultiplier = computed(() => {
    return Math.pow(1.25, prestigeLevel.value + 1)
  })
  
  
  
  // Generator-specific multiplier
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
  
  
  // Production rate from all generators (includes all multipliers)
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
  
  // Click value for manual clicks
  const clickValue = computed(() => {
    return 1 * globalMultiplier.value
  })
  
  // Task progress (time-based, computed from reactive current time)
  const taskProgress = computed(() => {
    const timeElapsed = currentTime.value - taskStartTime.value
    const timeRemaining = Math.max(0, taskDuration - timeElapsed)
    const progressPercent = Math.min(100, (timeElapsed / taskDuration) * 100)
    const isComplete = timeElapsed >= taskDuration
    
    return {
      timeElapsed,
      timeRemaining,
      progressPercent,
      isComplete,
      rewardAmount: taskReward,
      duration: taskDuration,
    }
  })
  
  
  // ===== HELPER FUNCTIONS =====
  
  // Format currency for display
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
  
  // ===== NARRATIVE SYSTEM =====
  
  // Subscribe to narrative events
  function onNarrativeEvent(callback: (event: NarrativeEvent) => void): void {
    eventCallbacks.value.push(callback)
  }
  
  // Generic narrative trigger function
  function triggerNarrative(
    triggerType: string,
    triggerValue?: number,
    triggerCondition?: string,
  ): void {
    const eligibleEvents = narrative.value.currentStoryEvents.filter((event) => {
      // Skip already viewed events
      if (event.isViewed) return false

      // Check trigger type
      if (event.triggerType !== triggerType) return false

      // Check trigger value (if specified)
      if (event.triggerValue !== undefined) {
        if (triggerValue === undefined || triggerValue < event.triggerValue) {
          return false
        }
      }

      // Check trigger condition (if specified)
      if (event.triggerCondition !== undefined) {
        if (triggerCondition !== event.triggerCondition) {
          return false
        }
      }

      return true
    })

    // Sort by priority (highest first)
    eligibleEvents.sort((a, b) => b.priority - a.priority)

    // Process each eligible event
    eligibleEvents.forEach((event) => {
      triggerNarrativeEvent(event)
    })
  }
  
  // Trigger a specific narrative event
  function triggerNarrativeEvent(event: NarrativeEvent): void {
    // Mark event as viewed
    event.isViewed = true
    narrative.value.viewedEvents.push(event.id)

    // Apply societal stability impact
    narrative.value.societalStability = Math.max(
      0,
      Math.min(100, narrative.value.societalStability + event.societalStabilityImpact),
    )

    // Add to pending events for display
    narrative.value.pendingEvents.push(event)

    // Notify subscribers
    eventCallbacks.value.forEach((callback) => callback(event))

    console.log(`Narrative Event Triggered: ${event.title}`)
    console.log(`Societal Stability: ${narrative.value.societalStability}%`)
  }
  
  // Get the next pending event to display
  function getNextPendingEvent(): NarrativeEvent | null {
    return narrative.value.pendingEvents.shift() || null
  }
  
  // Check if there are pending events
  function hasPendingEvents(): boolean {
    return narrative.value.pendingEvents.length > 0
  }
  
  
  // ===== ACTIONS =====
  
  // Resource management
  function addContentUnits(amount: number): void {
    contentUnits.value += amount
    lifetimeContentUnits.value += amount
  }
  
  function spendContentUnits(amount: number): boolean {
    if (contentUnits.value >= amount) {
      contentUnits.value -= amount
      return true
    }
    return false
  }
  
  function canAfford(amount: number): boolean {
    return contentUnits.value >= amount
  }
  
  // Generator management
  function getGenerator(id: string): GeneratorConfig | undefined {
    return generators.value.find(g => g.id === id)
  }
  
  function getGeneratorCost(generatorId: string): number {
    const generator = generators.value.find(g => g.id === generatorId)
    if (!generator) return 0
    
    // cost_next = cost_base × (rate_growth)^owned
    return Math.floor(generator.baseCost * Math.pow(generator.growthRate, generator.owned))
  }
  
  function canPurchaseGenerator(generatorId: string): boolean {
    const cost = getGeneratorCost(generatorId)
    return canAfford(cost)
  }
  
  function purchaseGenerator(generatorId: string): boolean {
    const generator = generators.value.find(g => g.id === generatorId)
    if (!generator) return false
    
    const cost = getGeneratorCost(generatorId)
    
    if (canAfford(cost)) {
      if (spendContentUnits(cost)) {
        generator.owned++
        
        // Trigger narrative events for generator purchase
        triggerNarrative('generatorPurchase', undefined, generatorId)
        
        return true
      }
    }
    
    return false
  }
  
  function getGeneratorProductionRate(id: string): number {
    const generator = generators.value.find(g => g.id === id)
    if (!generator) return 0
    
    let rate = generator.baseProduction * generator.owned
    rate *= getGeneratorMultiplier(generator.id)
    
    return rate
  }
  
  // Upgrade management
  function getUpgrade(id: string): UpgradeConfig | undefined {
    return upgrades.value.find(u => u.id === id)
  }
  
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
  
  function canPurchaseUpgrade(upgradeId: string): boolean {
    const upgrade = upgrades.value.find(u => u.id === upgradeId)
    if (!upgrade) return false
    
    return (
      !upgrade.isPurchased &&
      canAfford(upgrade.cost) &&
      areUpgradeRequirementsMet(upgradeId)
    )
  }
  
  function purchaseUpgrade(upgradeId: string): boolean {
    const upgrade = upgrades.value.find(u => u.id === upgradeId)
    if (!upgrade) return false
    
    if (!canPurchaseUpgrade(upgradeId)) {
      return false
    }
    
    if (spendContentUnits(upgrade.cost)) {
      upgrade.isPurchased = true
      
      // Trigger narrative events for upgrade purchase
      triggerNarrative('upgrade', undefined, upgradeId)
      
      return true
    }
    
    return false
  }
  
  // Manual content generation (clicker mechanic)
  function clickForContent(): void {
    addContentUnits(clickValue.value)
    
    // Check narrative triggers for content units
    triggerNarrative('contentUnits', contentUnits.value)
  }
  
  // Prestige management
  function performPrestige(): boolean {
    if (!canPrestige.value) {
      return false
    }
    
    // Trigger narrative events for prestige
    triggerNarrative('prestige', prestigeLevel.value)
    
    // Increase prestige level
    prestigeLevel.value++
    
    // Reset game state (but keep lifetime HCU)
    contentUnits.value = 0
    resetGenerators()
    resetUpgrades()
    
    // Reset narrative tracking but keep story progress
    narrative.value.pendingEvents = []
    
    return true
  }
  
  function resetGenerators(): void {
    // Reset all generator owned counts
    for (const generator of generators.value) {
      generator.owned = 0
    }
  }
  
  function resetUpgrades(): void {
    // Reset all upgrade purchases
    for (const upgrade of upgrades.value) {
      upgrade.isPurchased = false
    }
  }
  
  // Task management
  function completeTask(): boolean {
    const progress = taskProgress.value
    if (!progress.isComplete) {
      return false
    }
    
    // Grant reward
    addContentUnits(taskReward)
    
    // Reset timer
    taskStartTime.value = currentTime.value
    
    return true
  }
  
  // ===== GAME LOOP =====
  
  const tickRate = 100 // 100ms tick rate
  
  function startGameLoop(): void {
    if (gameLoop !== null) return
    
    isRunning.value = true
    
    gameLoop = setInterval(() => {
      // Update reactive current time
      currentTime.value = Date.now()
      
      // Calculate passive income from generators (production rate is auto-computed)
      if (productionRate.value > 0) {
        const productionThisTick = (productionRate.value * tickRate) / 1000
        addContentUnits(productionThisTick)
      }
      
      // Check for task completion and auto-complete
      if (taskProgress.value.isComplete) {
        completeTask()
      }
      
      // Check narrative triggers based on content units
      if (Math.floor(contentUnits.value) > Math.floor(lastContentUnitsCheck.value)) {
        triggerNarrative('contentUnits', contentUnits.value)
        lastContentUnitsCheck.value = contentUnits.value
      }
      
      // Check time elapsed triggers
      const timeElapsed = currentTime.value - narrative.value.gameStartTime
      triggerNarrative('timeElapsed', timeElapsed)
      
    }, tickRate)
    
    
    // Trigger game start narrative (only once)
    if (!hasTriggeredGameStart.value) {
      triggerNarrative('gameStart')
      hasTriggeredGameStart.value = true
    }
  }
  
  function stopGameLoop(): void {
    if (gameLoop) {
      clearInterval(gameLoop)
      gameLoop = null
    }
    isRunning.value = false
  }
  
  
  return {
    // State
    isRunning,
    contentUnits,
    lifetimeContentUnits,
    generators,
    upgrades,
    prestigeLevel,
    narrative,
    taskStartTime,
    
    // Computed
    globalMultiplier,
    prestigeThreshold,
    canPrestige,
    nextPrestigeMultiplier,
    productionRate,
    clickValue,
    taskProgress,
    
    // Helpers
    formatContentUnits,
    getGeneratorMultiplier,
    
    // Actions
    addContentUnits,
    spendContentUnits,
    canAfford,
    getGenerator,
    getGeneratorCost,
    canPurchaseGenerator,
    purchaseGenerator,
    getGeneratorProductionRate,
    getUpgrade,
    areUpgradeRequirementsMet,
    canPurchaseUpgrade,
    purchaseUpgrade,
    clickForContent,
    performPrestige,
    resetGenerators,
    resetUpgrades,
    completeTask,
    
    // Game Loop
    startGameLoop,
    stopGameLoop,
    
    // Narrative System
    onNarrativeEvent,
    triggerNarrative,
    getNextPendingEvent,
    hasPendingEvents,
  }
}, {
  persist: true
})