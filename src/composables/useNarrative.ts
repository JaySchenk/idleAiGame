import { ref } from 'vue'
import type { NarrativeEvent } from '../config/narratives'
import { UnlockSystem } from '../utils/unlockSystem'
import type { GameState } from '../stores/gameStore'

/**
 * Narrative system composable that manages story events, triggers, and progression
 */
export function useNarrative(initialNarratives: NarrativeEvent[]) {
  // Narrative state
  const narrative = ref({
    currentStoryEvents: initialNarratives,
    viewedEvents: [] as string[],
    societalStability: 100,
    pendingEvents: [] as NarrativeEvent[],
    isNarrativeActive: false,
    gameStartTime: Date.now(),
  })

  // Narrative tracking state
  const eventCallbacks = ref<((event: NarrativeEvent) => void)[]>([])

  /**
   * Subscribe to narrative events
   */
  function onNarrativeEvent(callback: (event: NarrativeEvent) => void): void {
    eventCallbacks.value.push(callback)
  }

  /**
   * Check and trigger eligible narrative events based on game state
   */
  function checkAndTriggerNarratives(gameState: GameState): void {
    const eligibleEvents = narrative.value.currentStoryEvents.filter((event) => {
      // Skip already viewed events
      if (event.isViewed) return false

      // Check unlock conditions using unified system
      const result = UnlockSystem.checkConditions(event.unlockConditions, gameState)
      return result.isUnlocked
    })

    // Sort by priority (highest first)
    eligibleEvents.sort((a, b) => b.priority - a.priority)

    // Process each eligible event
    eligibleEvents.forEach((event) => {
      triggerNarrativeEvent(event)
    })
  }

  /**
   * Trigger a specific narrative event
   * Marks event as viewed, applies effects, and notifies subscribers
   */
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
  }

  /**
   * Get the next pending event to display
   */
  function getNextPendingEvent(): NarrativeEvent | null {
    return narrative.value.pendingEvents.shift() || null
  }

  /**
   * Check if there are pending events
   */
  function hasPendingEvents(): boolean {
    return narrative.value.pendingEvents.length > 0
  }

  /**
   * Reset narrative state for prestige (but keep story progress)
   */
  function resetForPrestige(): void {
    narrative.value.pendingEvents = []
  }

  // Getters for game loop integration
  const getGameStartTime = () => narrative.value.gameStartTime

  return {
    // State
    narrative,
    eventCallbacks,

    // Actions
    onNarrativeEvent,
    checkAndTriggerNarratives,
    triggerNarrativeEvent,
    getNextPendingEvent,
    hasPendingEvents,
    resetForPrestige,

    // Game loop integration helpers
    getGameStartTime,
  }
}
