import { ref } from 'vue'
import type { NarrativeEvent } from '../config/narratives'

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
  const hasTriggeredGameStart = ref(false)
  const lastContentUnitsCheck = ref(0)
  const eventCallbacks = ref<((event: NarrativeEvent) => void)[]>([])

  /**
   * Subscribe to narrative events
   */
  function onNarrativeEvent(callback: (event: NarrativeEvent) => void): void {
    eventCallbacks.value.push(callback)
  }

  /**
   * Generic narrative trigger function
   * Finds and triggers eligible events based on criteria
   */
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

    console.log(`Narrative Event Triggered: ${event.title}`)
    console.log(`Societal Stability: ${narrative.value.societalStability}%`)
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
  const getLastContentUnitsCheck = () => lastContentUnitsCheck.value
  const setLastContentUnitsCheck = (value: number) => {
    lastContentUnitsCheck.value = value
  }
  const getGameStartTime = () => narrative.value.gameStartTime
  const getHasTriggeredGameStart = () => hasTriggeredGameStart.value
  const setHasTriggeredGameStart = (value: boolean) => {
    hasTriggeredGameStart.value = value
  }

  return {
    // State
    narrative,
    hasTriggeredGameStart,
    lastContentUnitsCheck,
    eventCallbacks,

    // Actions
    onNarrativeEvent,
    triggerNarrative,
    triggerNarrativeEvent,
    getNextPendingEvent,
    hasPendingEvents,
    resetForPrestige,

    // Game loop integration helpers
    getLastContentUnitsCheck,
    setLastContentUnitsCheck,
    getGameStartTime,
    getHasTriggeredGameStart,
    setHasTriggeredGameStart,
  }
}
