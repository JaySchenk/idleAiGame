import { narrativeEvents, type NarrativeEvent } from '../assets/narratives'

export interface NarrativeState {
  currentStoryEvents: NarrativeEvent[]
  viewedEvents: string[]
  societalStability: number // 0-100, starts at 100
  pendingEvents: NarrativeEvent[]
  isNarrativeActive: boolean
  gameStartTime: number
}

export class NarrativeManager {
  private static instance: NarrativeManager
  private state: NarrativeState
  private eventCallbacks: ((event: NarrativeEvent) => void)[] = []

  private constructor() {
    this.state = {
      currentStoryEvents: [...narrativeEvents],
      viewedEvents: [],
      societalStability: 100,
      pendingEvents: [],
      isNarrativeActive: false,
      gameStartTime: Date.now(),
    }

    // Initialize all events as unviewed
    this.state.currentStoryEvents.forEach((event) => {
      event.isViewed = false
    })
  }

  public static getInstance(): NarrativeManager {
    if (!NarrativeManager.instance) {
      NarrativeManager.instance = new NarrativeManager()
    }
    return NarrativeManager.instance
  }

  // Subscribe to narrative events
  public onNarrativeEvent(callback: (event: NarrativeEvent) => void): void {
    this.eventCallbacks.push(callback)
  }

  // Trigger narrative events based on game state
  public checkGameStartTrigger(): void {
    this.checkTrigger('gameStart')
  }

  public checkContentUnitsTrigger(currentContentUnits: number): void {
    this.checkTrigger('contentUnits', currentContentUnits)
  }

  public checkGeneratorPurchaseTrigger(generatorId: string): void {
    this.checkTrigger('generatorPurchase', undefined, generatorId)
  }

  public checkUpgradeTrigger(upgradeId: string): void {
    this.checkTrigger('upgrade', undefined, upgradeId)
  }

  public checkPrestigeTrigger(prestigeLevel: number): void {
    this.checkTrigger('prestige', prestigeLevel)
  }

  public checkTimeElapsedTrigger(): void {
    const timeElapsed = Date.now() - this.state.gameStartTime
    this.checkTrigger('timeElapsed', timeElapsed)
  }

  private checkTrigger(
    triggerType: string,
    triggerValue?: number,
    triggerCondition?: string,
  ): void {
    const eligibleEvents = this.state.currentStoryEvents.filter((event) => {
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
      this.triggerEvent(event)
    })
  }

  private triggerEvent(event: NarrativeEvent): void {
    // Mark event as viewed
    event.isViewed = true
    this.state.viewedEvents.push(event.id)

    // Apply societal stability impact
    this.state.societalStability = Math.max(
      0,
      Math.min(100, this.state.societalStability + event.societalStabilityImpact),
    )

    // Add to pending events for display
    this.state.pendingEvents.push(event)

    // Notify subscribers
    this.eventCallbacks.forEach((callback) => callback(event))

    console.log(`Narrative Event Triggered: ${event.title}`)
    console.log(`Societal Stability: ${this.state.societalStability}%`)
  }

  // Get the next pending event to display
  public getNextPendingEvent(): NarrativeEvent | null {
    return this.state.pendingEvents.shift() || null
  }

  // Check if there are pending events
  public hasPendingEvents(): boolean {
    return this.state.pendingEvents.length > 0
  }

  // Get current societal stability (0-100)
  public getSocietalStability(): number {
    return this.state.societalStability
  }

  // Get societal stability as a visual decay factor (0-1, where 1 is maximum decay)
  public getVisualDecayFactor(): number {
    return 1 - this.state.societalStability / 100
  }

  // Get all viewed events for archive
  public getViewedEvents(): NarrativeEvent[] {
    return this.state.currentStoryEvents.filter((event) => event.isViewed)
  }

  // Get narrative state for saving
  public serializeState(): unknown {
    return {
      viewedEvents: this.state.viewedEvents,
      societalStability: this.state.societalStability,
      gameStartTime: this.state.gameStartTime,
    }
  }

  // Load narrative state from save
  public deserializeState(savedState: unknown): void {
    if (savedState && typeof savedState === 'object') {
      const state = savedState as Record<string, unknown>
      
      if (Array.isArray(state.viewedEvents)) {
        this.state.viewedEvents = state.viewedEvents as string[]

        // Mark events as viewed
        this.state.currentStoryEvents.forEach((event) => {
          event.isViewed = this.state.viewedEvents.includes(event.id)
        })
      }

      if (typeof state.societalStability === 'number') {
        this.state.societalStability = state.societalStability
      }

      if (typeof state.gameStartTime === 'number') {
        this.state.gameStartTime = state.gameStartTime
      }
    }
  }

  // Reset narrative state for prestige
  public resetForPrestige(): void {
    // Don't reset viewed events or stability - this persists across prestiges
    // Only clear pending events
    this.state.pendingEvents = []
  }

  // Get narrative statistics
  public getStatistics() {
    return {
      totalEvents: this.state.currentStoryEvents.length,
      viewedEvents: this.state.viewedEvents.length,
      societalStability: this.state.societalStability,
      pendingEvents: this.state.pendingEvents.length,
      decayFactor: this.getVisualDecayFactor(),
    }
  }

  // Force trigger an event by ID (for debugging)
  public forceEvent(eventId: string): void {
    const event = this.state.currentStoryEvents.find((e) => e.id === eventId)
    if (event && !event.isViewed) {
      this.triggerEvent(event)
    }
  }
}
