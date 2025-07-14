// Interface for serializable game state
export interface GameState {
  version: string
  timestamp: number
  contentUnits: number
  prestigeLevel: number
  globalMultiplier: number
  generators: {
    [generatorId: string]: {
      owned: number
      baseCost: number
      costMultiplier: number
    }
  }
  upgrades: {
    [upgradeId: string]: {
      isPurchased: boolean
    }
  }
  narrative?: any // Narrative state from NarrativeManager
  hasTriggeredGameStart?: boolean // Narrative tracking
}

export class SaveManager {
  private static instance: SaveManager
  private readonly SAVE_KEY = 'idle-game-save'
  private readonly CURRENT_VERSION = '1.0.0'
  
  private constructor() {}
  
  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager()
    }
    return SaveManager.instance
  }
  
  // Save game state to localStorage
  public saveGame(gameState: GameState): boolean {
    try {
      // Add version and timestamp
      const saveData: GameState = {
        ...gameState,
        version: this.CURRENT_VERSION,
        timestamp: Date.now()
      }
      
      // Serialize and compress data
      const serializedData = JSON.stringify(saveData)
      
      // Check if localStorage is available
      if (typeof Storage === 'undefined') {
        console.warn('localStorage is not available')
        return false
      }
      
      // Save to localStorage
      localStorage.setItem(this.SAVE_KEY, serializedData)
      
      console.log('Game saved successfully')
      return true
    } catch (error) {
      console.error('Failed to save game:', error)
      
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded')
        // Could implement data cleanup here
      }
      
      return false
    }
  }
  
  // Load game state from localStorage
  public loadGame(): GameState | null {
    try {
      // Check if localStorage is available
      if (typeof Storage === 'undefined') {
        console.warn('localStorage is not available')
        return null
      }
      
      const savedData = localStorage.getItem(this.SAVE_KEY)
      if (!savedData) {
        console.log('No saved game found')
        return null
      }
      
      // Parse saved data
      const gameState: GameState = JSON.parse(savedData)
      
      // Validate save data
      if (!this.validateSaveData(gameState)) {
        console.error('Invalid save data found')
        return null
      }
      
      // Check version compatibility
      if (gameState.version !== this.CURRENT_VERSION) {
        console.warn(`Save version ${gameState.version} differs from current ${this.CURRENT_VERSION}`)
        // Could implement migration logic here
      }
      
      console.log('Game loaded successfully')
      return gameState
    } catch (error) {
      console.error('Failed to load game:', error)
      return null
    }
  }
  
  // Validate save data structure and values
  private validateSaveData(gameState: unknown): gameState is GameState {
    if (!gameState || typeof gameState !== 'object') {
      return false
    }
    
    const state = gameState as Record<string, unknown>
    
    // Check required fields
    if (typeof state.contentUnits !== 'number' || state.contentUnits < 0) {
      return false
    }
    
    if (typeof state.prestigeLevel !== 'number' || state.prestigeLevel < 0) {
      return false
    }
    
    if (typeof state.globalMultiplier !== 'number' || state.globalMultiplier < 1) {
      return false
    }
    
    if (!state.generators || typeof state.generators !== 'object') {
      return false
    }
    
    if (!state.upgrades || typeof state.upgrades !== 'object') {
      return false
    }
    
    // Validate generators data
    const generators = state.generators as Record<string, unknown>
    for (const generatorId in generators) {
      const generator = generators[generatorId] as Record<string, unknown>
      if (typeof generator.owned !== 'number' || generator.owned < 0) {
        return false
      }
    }
    
    // Validate upgrades data
    const upgrades = state.upgrades as Record<string, unknown>
    for (const upgradeId in upgrades) {
      const upgrade = upgrades[upgradeId] as Record<string, unknown>
      if (typeof upgrade.isPurchased !== 'boolean') {
        return false
      }
    }
    
    return true
  }
  
  // Check if saved game exists
  public hasSavedGame(): boolean {
    try {
      if (typeof Storage === 'undefined') {
        return false
      }
      
      const savedData = localStorage.getItem(this.SAVE_KEY)
      return savedData !== null
    } catch (error) {
      console.error('Error checking for saved game:', error)
      return false
    }
  }
  
  // Clear saved game
  public clearSave(): boolean {
    try {
      if (typeof Storage === 'undefined') {
        return false
      }
      
      localStorage.removeItem(this.SAVE_KEY)
      console.log('Save game cleared')
      return true
    } catch (error) {
      console.error('Failed to clear save:', error)
      return false
    }
  }
  
  // Get save metadata
  public getSaveMetadata(): { version: string; timestamp: number } | null {
    try {
      if (typeof Storage === 'undefined') {
        return null
      }
      
      const savedData = localStorage.getItem(this.SAVE_KEY)
      if (!savedData) {
        return null
      }
      
      const gameState: GameState = JSON.parse(savedData)
      return {
        version: gameState.version || 'unknown',
        timestamp: gameState.timestamp || 0
      }
    } catch (error) {
      console.error('Failed to get save metadata:', error)
      return null
    }
  }
}