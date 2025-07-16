import { ResourceManager } from './Resources'
import { GeneratorManager } from './Generators'
import { UpgradeManager } from './Upgrades'
import { SaveManager } from './SaveManager'
import { NarrativeManager } from './NarrativeManager'
import type { GameState } from './SaveManager'

export class GameManager {
  private static instance: GameManager
  private resourceManager: ResourceManager
  private generatorManager: GeneratorManager
  private upgradeManager: UpgradeManager
  private saveManager: SaveManager
  private narrativeManager: NarrativeManager
  private gameLoop: number | null = null
  private isRunning: boolean = false
  private tickRate: number = 100 // 100ms tick rate
  private lastTickTime: number = 0

  // Prestige system
  private prestigeLevel: number = 0

  // Auto-save system
  private autoSaveInterval: number | null = null
  private autoSaveRate: number = 5000 // 5 seconds
  private lastSaveTime: number = 0
  private loadedFromSave: boolean = false

  // Narrative tracking
  private hasTriggeredGameStart: boolean = false
  private lastContentUnitsCheck: number = 0

  // Task progress timer
  private taskStartTime: number = Date.now()
  private taskDuration: number = 30000
  private taskReward: number = 10

  private constructor() {
    this.resourceManager = ResourceManager.getInstance()
    this.generatorManager = GeneratorManager.getInstance()
    this.upgradeManager = UpgradeManager.getInstance()
    this.saveManager = SaveManager.getInstance()
    this.narrativeManager = NarrativeManager.getInstance()

    // Initialize upgrade manager in generator manager
    this.generatorManager.initializeUpgradeManager()

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

  // Start the game loop
  public startGameLoop(): void {
    if (this.isRunning) return

    this.isRunning = true
    this.lastTickTime = Date.now()

    this.gameLoop = setInterval(() => {
      this.tick()
    }, this.tickRate)

    // Start auto-save
    this.startAutoSave()

    // Trigger game start narrative (only once)
    if (!this.hasTriggeredGameStart) {
      this.narrativeManager.checkGameStartTrigger()
      this.hasTriggeredGameStart = true
    }
  }

  // Stop the game loop
  public stopGameLoop(): void {
    if (this.gameLoop) {
      clearInterval(this.gameLoop)
      this.gameLoop = null
    }
    this.isRunning = false

    // Stop auto-save
    this.stopAutoSave()
  }

  // Main game tick - handles continuous progression
  private tick(): void {
    const currentTime = Date.now()
    const deltaTime = currentTime - this.lastTickTime
    this.lastTickTime = currentTime

    // Calculate passive income from generators
    const productionRate = this.generatorManager.getTotalProductionRate()

    if (productionRate > 0) {
      // Convert production per second to production per tick
      const productionThisTick = (productionRate * deltaTime) / 1000
      // Apply global prestige multiplier
      const finalProduction = productionThisTick * this.getGlobalMultiplier()
      this.resourceManager.addContentUnits(finalProduction)
    }

    // Check for task completion and auto-complete
    const taskProgress = this.getTaskProgress()
    if (taskProgress.isComplete) {
      this.completeTask()
    }

    // Check narrative triggers based on content units
    const currentContentUnits = this.resourceManager.getContentUnits()
    if (Math.floor(currentContentUnits) > Math.floor(this.lastContentUnitsCheck)) {
      this.narrativeManager.checkContentUnitsTrigger(currentContentUnits)
      this.lastContentUnitsCheck = currentContentUnits
    }

    // Check time elapsed triggers
    this.narrativeManager.checkTimeElapsedTrigger()
  }

  // Manual content generation (clicker mechanic)
  public clickForContent(): void {
    // Apply global prestige multiplier to manual clicks
    const clickValue = 1 * this.getGlobalMultiplier()
    this.resourceManager.addContentUnits(clickValue)

    // Check narrative triggers for content units
    const currentContentUnits = this.resourceManager.getContentUnits()
    this.narrativeManager.checkContentUnitsTrigger(currentContentUnits)
  }

  // Get current game state for UI
  public getGameState() {
    return {
      contentUnits: this.resourceManager.getContentUnits(),
      formattedContentUnits: this.resourceManager.formatContentUnits(),
      productionRate: this.generatorManager.getTotalProductionRate() * this.getGlobalMultiplier(),
      generators: this.generatorManager.getAllGenerators(),
      isRunning: this.isRunning,
      prestigeLevel: this.getPrestigeLevel(),
      globalMultiplier: this.getGlobalMultiplier(),
      prestigeThreshold: this.getPrestigeThreshold(),
      canPrestige: this.canPrestige(),
    }
  }

  // Purchase generator wrapper
  public purchaseGenerator(generatorId: string): boolean {
    const success = this.generatorManager.purchaseGenerator(generatorId)

    // Trigger narrative events for generator purchase
    if (success) {
      this.narrativeManager.checkGeneratorPurchaseTrigger(generatorId)
    }

    return success
  }

  // Get generator cost wrapper
  public getGeneratorCost(generatorId: string): number {
    return this.generatorManager.getGeneratorCost(generatorId)
  }

  // Check if generator can be purchased
  public canPurchaseGenerator(generatorId: string): boolean {
    return this.generatorManager.canPurchaseGenerator(generatorId)
  }

  // Get resource manager for direct access
  public getResourceManager(): ResourceManager {
    return this.resourceManager
  }

  // Get generator manager for direct access
  public getGeneratorManager(): GeneratorManager {
    return this.generatorManager
  }

  // Upgrade-related methods
  public purchaseUpgrade(upgradeId: string): boolean {
    const success = this.upgradeManager.purchaseUpgrade(upgradeId)

    // Trigger narrative events for upgrade purchase
    if (success) {
      this.narrativeManager.checkUpgradeTrigger(upgradeId)
    }

    return success
  }

  public canPurchaseUpgrade(upgradeId: string): boolean {
    return this.upgradeManager.canPurchaseUpgrade(upgradeId)
  }

  public getUpgradeManager(): UpgradeManager {
    return this.upgradeManager
  }

  public getNarrativeManager(): NarrativeManager {
    return this.narrativeManager
  }

  // Get current prestige level
  public getPrestigeLevel(): number {
    return this.prestigeLevel
  }

  // Calculate global multiplier based on prestige level
  public getGlobalMultiplier(): number {
    return Math.pow(1.25, this.prestigeLevel)
  }

  // Calculate current prestige threshold
  public getPrestigeThreshold(): number {
    return 1000 * Math.pow(10, this.prestigeLevel)
  }

  // Check if player can prestige (has enough current HCU for next level)
  public canPrestige(): boolean {
    const currentHCU = this.resourceManager.getContentUnits()
    const nextThreshold = 1000 * Math.pow(10, this.prestigeLevel)
    return currentHCU >= nextThreshold
  }

  public performPrestige(): boolean {
    if (!this.canPrestige()) {
      return false
    }

    // Trigger narrative events for prestige
    this.narrativeManager.checkPrestigeTrigger(this.prestigeLevel)

    // Increase prestige level
    this.prestigeLevel++

    // Reset game state (but keep lifetime HCU)
    this.resourceManager.resetContentUnits()
    this.resetGenerators()
    this.resetUpgrades()

    // Reset narrative tracking but keep story progress
    this.narrativeManager.resetForPrestige()
    this.lastContentUnitsCheck = 0

    return true
  }

  private resetGenerators(): void {
    // Reset all generator owned counts
    const generators = this.generatorManager.getAllGenerators()
    for (const generator of generators) {
      generator.owned = 0
    }
  }

  private resetUpgrades(): void {
    // Reset all upgrade purchases
    const upgrades = this.upgradeManager.getAllUpgrades()
    for (const upgrade of upgrades) {
      upgrade.isPurchased = false
    }
  }

  public getPrestigeInfo() {
    return {
      level: this.prestigeLevel,
      globalMultiplier: this.getGlobalMultiplier(),
      threshold: this.getPrestigeThreshold(),
      canPrestige: this.canPrestige(),
      nextMultiplier: Math.pow(1.25, this.prestigeLevel + 1),
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
    for (const generator of this.generatorManager.getAllGenerators()) {
      generators[generator.id] = {
        owned: generator.owned,
      }
    }

    // Serialize upgrades - only store purchased IDs
    const purchasedUpgrades: string[] = []
    for (const upgrade of this.upgradeManager.getAllUpgrades()) {
      if (upgrade.isPurchased) {
        purchasedUpgrades.push(upgrade.id)
      }
    }

    return {
      version: '1.0.0',
      timestamp: Date.now(),
      contentUnits: this.resourceManager.getContentUnits(),
      lifetimeContentUnits: this.resourceManager.getLifetimeContentUnits(),
      prestigeLevel: this.prestigeLevel,
      generators,
      purchasedUpgrades,
      narrative: this.narrativeManager.serializeState(),
      hasTriggeredGameStart: this.hasTriggeredGameStart,
      taskStartTime: this.taskStartTime,
      lastContentUnitsCheck: this.lastContentUnitsCheck,
    }
  }

  // Deserialize and apply game state
  private deserializeGameState(gameState: GameState): void {
    // Restore basic state
    this.resourceManager.setContentUnits(gameState.contentUnits)
    this.resourceManager.setLifetimeContentUnits(gameState.lifetimeContentUnits)
    
    // Restore prestige level
    this.prestigeLevel = gameState.prestigeLevel

    // Restore generators
    for (const generatorId in gameState.generators) {
      const generator = this.generatorManager.getGenerator(generatorId)
      if (generator) {
        const savedGenerator = gameState.generators[generatorId]
        generator.owned = savedGenerator.owned
      }
    }

    // Restore upgrades
    this.upgradeManager.setPurchasedUpgrades(gameState.purchasedUpgrades)

    // Restore narrative state
    if (gameState.narrative) {
      this.narrativeManager.deserializeState(gameState.narrative)
    }

    // Restore narrative tracking
    this.hasTriggeredGameStart = gameState.hasTriggeredGameStart ?? false
    this.lastContentUnitsCheck = gameState.lastContentUnitsCheck ?? 0

    // Restore timer state
    this.taskStartTime = gameState.taskStartTime ?? Date.now()
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
    this.resourceManager.addContentUnits(this.taskReward)

    // Reset timer
    this.taskStartTime = Date.now()

    return true
  }
}
