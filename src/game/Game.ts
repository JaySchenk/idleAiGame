import { SaveManager } from './SaveManager'
import type { GameState } from './SaveManager'
import { reactive } from 'vue'
import { narrativeEvents, type NarrativeEvent } from '../assets/narratives'

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


export class GameManager {
  private static instance: GameManager
  private saveManager: SaveManager
  private gameLoop: number | null = null
  private tickRate: number = 100 // 100ms tick rate
  private lastTickTime: number = 0

  // Auto-save system
  private autoSaveInterval: number | null = null
  private autoSaveRate: number = 5000 // 5 seconds
  private lastSaveTime: number = 0
  private loadedFromSave: boolean = false

  // Narrative tracking
  private hasTriggeredGameStart: boolean = false
  private lastContentUnitsCheck: number = 0
  private eventCallbacks: ((event: NarrativeEvent) => void)[] = []

  // Task progress timer
  private taskStartTime: number = Date.now()
  private taskDuration: number = 30000
  private taskReward: number = 10

  // Core game data
  private generators: Map<string, GeneratorConfig> = new Map()
  private upgrades: Map<string, UpgradeConfig> = new Map()

  // Reactive state for UI - all game state centralized here
  public state = reactive({
    isRunning: false,
    // Resources
    contentUnits: 0,
    lifetimeContentUnits: 0,
    formattedContentUnits: '0',
    // Production
    productionRate: 0,
    // Prestige
    prestigeLevel: 0,
    globalMultiplier: 1,
    prestigeThreshold: 1000,
    canPrestige: false,
    // Generators
    generators: [] as GeneratorConfig[],
    // Upgrades
    upgrades: [] as UpgradeConfig[],
    // Narrative
    narrative: {
      currentStoryEvents: [] as NarrativeEvent[],
      viewedEvents: [] as string[],
      societalStability: 100,
      pendingEvents: [] as NarrativeEvent[],
      isNarrativeActive: false,
      gameStartTime: Date.now(),
    },
    // Prestige info
    prestige: {
      level: 0,
      globalMultiplier: 1,
      threshold: 1000,
      canPrestige: false,
      nextMultiplier: 1.25,
    },
    // Task progress
    taskProgress: {
      timeElapsed: 0,
      timeRemaining: 30000,
      progressPercent: 0,
      isComplete: false,
      rewardAmount: 10,
      duration: 30000,
    },
  })

  private constructor() {
    this.saveManager = SaveManager.getInstance()

    // Initialize game data
    this.initializeGenerators()
    this.initializeUpgrades()
    this.initializeNarrative()

    // Try to load saved game
    this.loadGame()

    // Save on F5 refresh
    this.setupKeyboardListeners()
  }

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager()
    }
    return GameManager.instance
  }

  // Initialize generators
  private initializeGenerators(): void {
    const basicAdBot: GeneratorConfig = {
      id: 'basicAdBotFarm',
      name: 'Basic Ad-Bot Farm',
      baseCost: 10,
      growthRate: 1.15,
      baseProduction: 1,
      owned: 0,
    }
    this.generators.set(basicAdBot.id, basicAdBot)
    this.state.generators = Array.from(this.generators.values())
  }

  // Initialize upgrades
  private initializeUpgrades(): void {
    const soulCrushingAutomation: UpgradeConfig = {
      id: 'automatedContentScript',
      name: 'Soul-Crushing Automation',
      description: 'Increases Mindless Ad-Bot Farm production by 25%',
      cost: 50,
      targetGenerator: 'basicAdBotFarm',
      effectType: 'production_multiplier',
      effectValue: 1.25,
      requirements: [
        {
          generatorId: 'basicAdBotFarm',
          minOwned: 5,
        },
      ],
      isPurchased: false,
    }
    this.upgrades.set(soulCrushingAutomation.id, soulCrushingAutomation)
    this.state.upgrades = Array.from(this.upgrades.values())
  }

  // Initialize narrative
  private initializeNarrative(): void {
    this.state.narrative.currentStoryEvents = [...narrativeEvents]
    this.state.narrative.viewedEvents = []
    this.state.narrative.societalStability = 100
    this.state.narrative.pendingEvents = []
    this.state.narrative.isNarrativeActive = false
    this.state.narrative.gameStartTime = Date.now()

    // Initialize all events as unviewed
    this.state.narrative.currentStoryEvents.forEach((event) => {
      event.isViewed = false
    })
  }

  // Start the game loop
  public startGameLoop(): void {
    if (this.state.isRunning) return

    this.state.isRunning = true
    this.lastTickTime = Date.now()

    this.gameLoop = setInterval(() => {
      this.tick()
    }, this.tickRate)

    // Start auto-save
    this.startAutoSave()

    // Trigger game start narrative (only once)
    if (!this.hasTriggeredGameStart) {
      this.checkGameStartTrigger()
      this.hasTriggeredGameStart = true
    }
  }

  // Stop the game loop
  public stopGameLoop(): void {
    if (this.gameLoop) {
      clearInterval(this.gameLoop)
      this.gameLoop = null
    }
    this.state.isRunning = false

    // Stop auto-save
    this.stopAutoSave()
  }

  // Main game tick - handles continuous progression
  private tick(): void {
    const currentTime = Date.now()
    const deltaTime = currentTime - this.lastTickTime
    this.lastTickTime = currentTime

    // Calculate passive income from generators
    const productionRate = this.getTotalProductionRate()
    this.state.productionRate = productionRate * this.getGlobalMultiplier()

    if (productionRate > 0) {
      // Convert production per second to production per tick
      const productionThisTick = (productionRate * deltaTime) / 1000
      // Apply global prestige multiplier
      const finalProduction = productionThisTick * this.getGlobalMultiplier()
      this.addContentUnits(finalProduction)
    }

    // Check for task completion and auto-complete
    const taskProgress = this.getTaskProgress()
    if (taskProgress.isComplete) {
      this.completeTask()
    }

    // Check narrative triggers based on content units
    if (Math.floor(this.state.contentUnits) > Math.floor(this.lastContentUnitsCheck)) {
      this.checkContentUnitsTrigger(this.state.contentUnits)
      this.lastContentUnitsCheck = this.state.contentUnits
    }

    // Check time elapsed triggers
    this.checkTimeElapsedTrigger()

    // Update computed state
    this.updateComputedState()
  }

  // Update computed state values
  private updateComputedState(): void {
    this.state.formattedContentUnits = this.formatContentUnits()
    this.state.globalMultiplier = this.getGlobalMultiplier()
    this.state.prestigeThreshold = this.getPrestigeThreshold()
    this.state.canPrestige = this.canPrestige()
    this.state.taskProgress = this.getTaskProgress()

    // Update prestige state
    const prestigeInfo = this.getPrestigeInfo()
    this.state.prestige.level = prestigeInfo.level
    this.state.prestige.globalMultiplier = prestigeInfo.globalMultiplier
    this.state.prestige.threshold = prestigeInfo.threshold
    this.state.prestige.canPrestige = prestigeInfo.canPrestige
    this.state.prestige.nextMultiplier = prestigeInfo.nextMultiplier
  }

  // Manual content generation (clicker mechanic)
  public clickForContent(): void {
    // Apply global prestige multiplier to manual clicks
    const clickValue = 1 * this.getGlobalMultiplier()
    this.addContentUnits(clickValue)

    // Check narrative triggers for content units
    this.checkContentUnitsTrigger(this.state.contentUnits)

    // Update computed state immediately for responsive UI
    this.updateComputedState()
  }

  // ===== RESOURCE MANAGEMENT =====

  // Add Content Units
  public addContentUnits(amount: number): void {
    this.state.contentUnits += amount
    this.state.lifetimeContentUnits += amount
  }

  // Spend Content Units (returns true if successful)
  public spendContentUnits(amount: number): boolean {
    if (this.state.contentUnits >= amount) {
      this.state.contentUnits -= amount
      return true
    }
    return false
  }

  // Check if player can afford amount
  public canAfford(amount: number): boolean {
    return this.state.contentUnits >= amount
  }

  // Format currency for display
  public formatContentUnits(amount?: number): string {
    const value = amount !== undefined ? amount : this.state.contentUnits

    // Handle scientific notation for very large numbers
    if (value >= 1e18) {
      return value.toExponential(2) + ' HCU'
    }

    // Handle quadrillions
    if (value >= 1e15) {
      return (value / 1e15).toFixed(2) + 'Q HCU'
    }

    // Handle trillions
    if (value >= 1e12) {
      return (value / 1e12).toFixed(2) + 'T HCU'
    }

    // Handle billions
    if (value >= 1e9) {
      return (value / 1e9).toFixed(2) + 'B HCU'
    }

    // Handle millions
    if (value >= 1e6) {
      return (value / 1e6).toFixed(2) + 'M HCU'
    }

    // Handle thousands
    if (value >= 1e3) {
      return (value / 1e3).toFixed(2) + 'K HCU'
    }

    // Handle smaller numbers with 2 decimals
    return value.toFixed(2) + ' HCU'
  }

  // ===== GENERATOR MANAGEMENT =====

  // Get generator by ID
  public getGenerator(id: string): GeneratorConfig | undefined {
    return this.generators.get(id)
  }

  // Calculate current cost for next purchase
  public getGeneratorCost(generatorId: string): number {
    const generator = this.generators.get(generatorId)
    if (!generator) return 0

    // cost_next = cost_base × (rate_growth)^owned
    return Math.floor(generator.baseCost * Math.pow(generator.growthRate, generator.owned))
  }

  // Purchase generator
  public purchaseGenerator(generatorId: string): boolean {
    const generator = this.generators.get(generatorId)
    if (!generator) return false

    const cost = this.getGeneratorCost(generatorId)

    if (this.canAfford(cost)) {
      if (this.spendContentUnits(cost)) {
        generator.owned++
        this.state.generators = Array.from(this.generators.values())

        // Trigger narrative events for generator purchase
        this.checkGeneratorPurchaseTrigger(generatorId)

        // Update computed state immediately for responsive UI
        this.updateComputedState()
        return true
      }
    }

    return false
  }

  // Check if generator can be purchased
  public canPurchaseGenerator(generatorId: string): boolean {
    const cost = this.getGeneratorCost(generatorId)
    return this.canAfford(cost)
  }

  // Get total production rate (CPS) from all generators
  public getTotalProductionRate(): number {
    let totalRate = 0

    for (const generator of this.generators.values()) {
      let generatorRate = generator.baseProduction * generator.owned

      // Apply upgrade multipliers
      generatorRate *= this.getGeneratorMultiplier(generator.id)

      totalRate += generatorRate
    }

    // Apply global multiplier from upgrades only (not prestige)
    totalRate *= this.getUpgradeGlobalMultiplier()

    return totalRate
  }

  // Get specific generator production rate
  public getGeneratorProductionRate(id: string): number {
    const generator = this.generators.get(id)
    if (!generator) return 0

    let rate = generator.baseProduction * generator.owned
    rate *= this.getGeneratorMultiplier(generator.id)

    return rate
  }

  // ===== UPGRADE MANAGEMENT =====

  // Get upgrade by ID
  public getUpgrade(id: string): UpgradeConfig | undefined {
    return this.upgrades.get(id)
  }

  // Check if upgrade requirements are met
  public areUpgradeRequirementsMet(upgradeId: string): boolean {
    const upgrade = this.upgrades.get(upgradeId)
    if (!upgrade) return false

    for (const requirement of upgrade.requirements) {
      const generator = this.generators.get(requirement.generatorId)
      if (!generator || generator.owned < requirement.minOwned) {
        return false
      }
    }

    return true
  }

  // Check if upgrade can be purchased
  public canPurchaseUpgrade(upgradeId: string): boolean {
    const upgrade = this.upgrades.get(upgradeId)
    if (!upgrade) return false

    return (
      !upgrade.isPurchased &&
      this.canAfford(upgrade.cost) &&
      this.areUpgradeRequirementsMet(upgradeId)
    )
  }

  // Purchase upgrade
  public purchaseUpgrade(upgradeId: string): boolean {
    const upgrade = this.upgrades.get(upgradeId)
    if (!upgrade) return false

    if (!this.canPurchaseUpgrade(upgradeId)) {
      return false
    }

    if (this.spendContentUnits(upgrade.cost)) {
      upgrade.isPurchased = true
      this.state.upgrades = Array.from(this.upgrades.values())

      // Trigger narrative events for upgrade purchase
      this.checkUpgradeTrigger(upgradeId)

      // Update computed state immediately for responsive UI
      this.updateComputedState()
      return true
    }

    return false
  }

  // Get production multiplier for a specific generator
  public getGeneratorMultiplier(generatorId: string): number {
    let multiplier = 1

    for (const upgrade of this.upgrades.values()) {
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

  // Get global multiplier from upgrades only (not prestige)
  public getUpgradeGlobalMultiplier(): number {
    let multiplier = 1

    for (const upgrade of this.upgrades.values()) {
      if (upgrade.isPurchased && upgrade.effectType === 'global_multiplier') {
        multiplier *= upgrade.effectValue
      }
    }

    return multiplier
  }

  // ===== NARRATIVE MANAGEMENT =====

  // Subscribe to narrative events
  public onNarrativeEvent(callback: (event: NarrativeEvent) => void): void {
    this.eventCallbacks.push(callback)
  }

  // Trigger narrative events based on game state
  public checkGameStartTrigger(): void {
    this.checkNarrativeTrigger('gameStart')
  }

  public checkContentUnitsTrigger(currentContentUnits: number): void {
    this.checkNarrativeTrigger('contentUnits', currentContentUnits)
  }

  public checkGeneratorPurchaseTrigger(generatorId: string): void {
    this.checkNarrativeTrigger('generatorPurchase', undefined, generatorId)
  }

  public checkUpgradeTrigger(upgradeId: string): void {
    this.checkNarrativeTrigger('upgrade', undefined, upgradeId)
  }

  public checkPrestigeTrigger(prestigeLevel: number): void {
    this.checkNarrativeTrigger('prestige', prestigeLevel)
  }

  public checkTimeElapsedTrigger(): void {
    const timeElapsed = Date.now() - this.state.narrative.gameStartTime
    this.checkNarrativeTrigger('timeElapsed', timeElapsed)
  }

  private checkNarrativeTrigger(
    triggerType: string,
    triggerValue?: number,
    triggerCondition?: string,
  ): void {
    const eligibleEvents = this.state.narrative.currentStoryEvents.filter((event) => {
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
      this.triggerNarrativeEvent(event)
    })
  }

  private triggerNarrativeEvent(event: NarrativeEvent): void {
    // Mark event as viewed
    event.isViewed = true
    this.state.narrative.viewedEvents.push(event.id)

    // Apply societal stability impact
    this.state.narrative.societalStability = Math.max(
      0,
      Math.min(100, this.state.narrative.societalStability + event.societalStabilityImpact),
    )

    // Add to pending events for display
    this.state.narrative.pendingEvents.push(event)

    // Notify subscribers
    this.eventCallbacks.forEach((callback) => callback(event))

    console.log(`Narrative Event Triggered: ${event.title}`)
    console.log(`Societal Stability: ${this.state.narrative.societalStability}%`)
  }


  // Get the next pending event to display
  public getNextPendingEvent(): NarrativeEvent | null {
    return this.state.narrative.pendingEvents.shift() || null
  }

  // Check if there are pending events
  public hasPendingEvents(): boolean {
    return this.state.narrative.pendingEvents.length > 0
  }

  // ===== PRESTIGE MANAGEMENT =====


  // Calculate global multiplier based on prestige level
  public getGlobalMultiplier(): number {
    return Math.pow(1.25, this.state.prestigeLevel)
  }

  // Calculate current prestige threshold
  public getPrestigeThreshold(): number {
    return 1000 * Math.pow(10, this.state.prestigeLevel)
  }

  // Check if player can prestige (has enough current HCU for next level)
  public canPrestige(): boolean {
    const currentHCU = this.state.contentUnits
    const nextThreshold = 1000 * Math.pow(10, this.state.prestigeLevel)
    return currentHCU >= nextThreshold
  }

  public performPrestige(): boolean {
    if (!this.canPrestige()) {
      return false
    }

    // Trigger narrative events for prestige
    this.checkPrestigeTrigger(this.state.prestigeLevel)

    // Increase prestige level
    this.state.prestigeLevel++

    // Reset game state (but keep lifetime HCU)
    this.state.contentUnits = 0
    this.resetGenerators()
    this.resetUpgrades()

    // Reset narrative tracking but keep story progress
    this.state.narrative.pendingEvents = []
    this.lastContentUnitsCheck = 0

    // Update computed state immediately
    this.updateComputedState()

    return true
  }

  private resetGenerators(): void {
    // Reset all generator owned counts
    for (const generator of this.generators.values()) {
      generator.owned = 0
    }
    this.state.generators = Array.from(this.generators.values())
  }

  private resetUpgrades(): void {
    // Reset all upgrade purchases
    for (const upgrade of this.upgrades.values()) {
      upgrade.isPurchased = false
    }
    this.state.upgrades = Array.from(this.upgrades.values())
  }

  public getPrestigeInfo() {
    return {
      level: this.state.prestigeLevel,
      globalMultiplier: this.getGlobalMultiplier(),
      threshold: this.getPrestigeThreshold(),
      canPrestige: this.canPrestige(),
      nextMultiplier: Math.pow(1.25, this.state.prestigeLevel + 1),
    }
  }

  // Save/Load System

  // Save current game state (auto-save only)
  private saveGame(): boolean {
    try {
      const gameState = this.serializeGameState()
      const success = this.saveManager.saveGame(gameState)

      if (success) {
        this.lastSaveTime = Date.now()
      }

      return success
    } catch (error) {
      console.error('Failed to save game:', error)
      return false
    }
  }

  // Load saved game state
  public loadGame(): boolean {
    try {
      const savedState = this.saveManager.loadGame()

      if (!savedState) {
        console.log('No saved game found, starting new game')
        this.loadedFromSave = false
        return false
      }

      this.deserializeGameState(savedState)
      this.loadedFromSave = true
      console.log('Game loaded successfully')
      return true
    } catch (error) {
      console.error('Failed to load game:', error)
      this.loadedFromSave = false
      return false
    }
  }

  // Serialize current game state
  private serializeGameState(): GameState {
    // Serialize generators - only store owned count
    const generators: {
      [key: string]: { owned: number }
    } = {}
    for (const generator of this.generators.values()) {
      generators[generator.id] = {
        owned: generator.owned,
      }
    }

    // Serialize upgrades - only store purchased IDs
    const purchasedUpgrades: string[] = []
    for (const upgrade of this.upgrades.values()) {
      if (upgrade.isPurchased) {
        purchasedUpgrades.push(upgrade.id)
      }
    }

    return {
      version: '1.0.0',
      timestamp: Date.now(),
      contentUnits: this.state.contentUnits,
      lifetimeContentUnits: this.state.lifetimeContentUnits,
      prestigeLevel: this.state.prestigeLevel,
      generators,
      purchasedUpgrades,
      narrative: this.serializeNarrativeState(),
      hasTriggeredGameStart: this.hasTriggeredGameStart,
      taskStartTime: this.taskStartTime,
      lastContentUnitsCheck: this.lastContentUnitsCheck,
    }
  }

  // Deserialize and apply game state
  private deserializeGameState(gameState: GameState): void {
    // Restore basic state
    this.state.contentUnits = gameState.contentUnits
    this.state.lifetimeContentUnits = gameState.lifetimeContentUnits

    // Restore prestige level
    this.state.prestigeLevel = gameState.prestigeLevel

    // Restore generators
    for (const generatorId in gameState.generators) {
      const generator = this.generators.get(generatorId)
      if (generator) {
        const savedGenerator = gameState.generators[generatorId]
        generator.owned = savedGenerator.owned
      }
    }
    this.state.generators = Array.from(this.generators.values())

    // Restore upgrades
    this.setPurchasedUpgrades(gameState.purchasedUpgrades)

    // Restore narrative state
    if (gameState.narrative) {
      this.deserializeNarrativeState(gameState.narrative)
    }

    // Restore narrative tracking
    this.hasTriggeredGameStart = gameState.hasTriggeredGameStart ?? false
    this.lastContentUnitsCheck = gameState.lastContentUnitsCheck ?? 0

    // Restore timer state
    this.taskStartTime = gameState.taskStartTime ?? Date.now()

    // Initialize computed state after loading
    this.updateComputedState()
  }

  // Set purchased upgrades from array of IDs (for save loading)
  private setPurchasedUpgrades(upgradeIds: string[]): void {
    // Reset all upgrades first
    for (const upgrade of this.upgrades.values()) {
      upgrade.isPurchased = false
    }

    // Set purchased upgrades
    for (const upgradeId of upgradeIds) {
      const upgrade = this.upgrades.get(upgradeId)
      if (upgrade) {
        upgrade.isPurchased = true
      }
    }
    this.state.upgrades = Array.from(this.upgrades.values())
  }

  // Serialize narrative state
  private serializeNarrativeState(): unknown {
    return {
      viewedEvents: this.state.narrative.viewedEvents,
      societalStability: this.state.narrative.societalStability,
      gameStartTime: this.state.narrative.gameStartTime,
    }
  }

  // Deserialize narrative state
  private deserializeNarrativeState(savedState: unknown): void {
    if (savedState && typeof savedState === 'object') {
      const state = savedState as Record<string, unknown>

      if (Array.isArray(state.viewedEvents)) {
        this.state.narrative.viewedEvents = state.viewedEvents as string[]

        // Mark events as viewed
        this.state.narrative.currentStoryEvents.forEach((event) => {
          event.isViewed = this.state.narrative.viewedEvents.includes(event.id)
        })
      }

      if (typeof state.societalStability === 'number') {
        this.state.narrative.societalStability = state.societalStability
      }

      if (typeof state.gameStartTime === 'number') {
        this.state.narrative.gameStartTime = state.gameStartTime
      }
    }
  }

  // Auto-save system
  private startAutoSave(): void {
    if (this.autoSaveInterval) return

    this.autoSaveInterval = setInterval(() => {
      this.saveGame()
    }, this.autoSaveRate)
  }

  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
    }
  }

  // Browser event listeners for saving
  private setupKeyboardListeners(): void {
    // Save before page unload (refresh, close, navigate away)
    window.addEventListener('beforeunload', () => {
      this.saveGame()
    })
  }

  // Save system utilities
  public hasSavedGame(): boolean {
    return this.saveManager.hasSavedGame()
  }

  public clearSave(): boolean {
    return this.saveManager.clearSave()
  }

  public getSaveMetadata() {
    return this.saveManager.getSaveMetadata()
  }

  public getLastSaveTime(): number {
    return this.lastSaveTime
  }

  public wasLoadedFromSave(): boolean {
    return this.loadedFromSave
  }

  public isAutoSaveActive(): boolean {
    return this.autoSaveInterval !== null
  }

  // Task progress timer methods
  public getTaskProgress() {
    const currentTime = Date.now()
    const timeElapsed = currentTime - this.taskStartTime
    const timeRemaining = Math.max(0, this.taskDuration - timeElapsed)
    const progressPercent = Math.min(100, (timeElapsed / this.taskDuration) * 100)
    const isComplete = timeElapsed >= this.taskDuration

    return {
      timeElapsed,
      timeRemaining,
      progressPercent,
      isComplete,
      rewardAmount: this.taskReward,
      duration: this.taskDuration,
    }
  }

  public completeTask(): boolean {
    const progress = this.getTaskProgress()
    if (!progress.isComplete) {
      return false
    }

    // Grant reward
    this.addContentUnits(this.taskReward)

    // Reset timer
    this.taskStartTime = Date.now()

    return true
  }
}
