import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNarrative } from '../useNarrative'
import type { NarrativeEvent } from '../../config/narratives'

describe('useNarrative', () => {
  let mockNarrativeEvents: NarrativeEvent[]

  beforeEach(() => {
    // Create fresh mock data for each test
    mockNarrativeEvents = [
      {
        id: 'gameStart',
        title: 'The AI Awakens',
        content: 'Test game start content',
        triggerType: 'gameStart',
        societalStabilityImpact: -5,
        priority: 1000,
        isViewed: false,
      },
      {
        id: 'firstClick',
        title: 'Manual Override',
        content: 'Test first click content',
        triggerType: 'contentUnits',
        triggerValue: 1,
        societalStabilityImpact: -1,
        priority: 900,
        isViewed: false,
      },
      {
        id: 'highValue',
        title: 'High Value Event',
        content: 'Test high value content',
        triggerType: 'contentUnits',
        triggerValue: 100,
        societalStabilityImpact: -10,
        priority: 800,
        isViewed: false,
      },
      {
        id: 'generatorEvent',
        title: 'Generator Purchase',
        content: 'Test generator content',
        triggerType: 'generatorPurchase',
        triggerCondition: 'basicAdBotFarm',
        societalStabilityImpact: -15,
        priority: 750,
        isViewed: false,
      },
    ]
  })

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      expect(narrative.narrative.value.currentStoryEvents).toHaveLength(4)
      expect(narrative.narrative.value.viewedEvents).toEqual([])
      expect(narrative.narrative.value.societalStability).toBe(100)
      expect(narrative.narrative.value.pendingEvents).toEqual([])
      expect(narrative.narrative.value.isNarrativeActive).toBe(false)
      expect(narrative.narrative.value.gameStartTime).toBeGreaterThan(0)
    })

    it('should initialize tracking state correctly', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      expect(narrative.hasTriggeredGameStart.value).toBe(false)
      expect(narrative.lastContentUnitsCheck.value).toBe(0)
      expect(narrative.eventCallbacks.value).toEqual([])
    })
  })

  describe('Event Subscription', () => {
    it('should allow subscribing to narrative events', () => {
      const narrative = useNarrative(mockNarrativeEvents)
      const callback = vi.fn()

      narrative.onNarrativeEvent(callback)

      expect(narrative.eventCallbacks.value).toContain(callback)
    })

    it('should support multiple subscribers', () => {
      const narrative = useNarrative(mockNarrativeEvents)
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      narrative.onNarrativeEvent(callback1)
      narrative.onNarrativeEvent(callback2)

      expect(narrative.eventCallbacks.value).toHaveLength(2)
      expect(narrative.eventCallbacks.value).toContain(callback1)
      expect(narrative.eventCallbacks.value).toContain(callback2)
    })
  })

  describe('Basic Event Triggering', () => {
    it('should trigger game start event', () => {
      const narrative = useNarrative(mockNarrativeEvents)
      const callback = vi.fn()
      narrative.onNarrativeEvent(callback)

      narrative.triggerNarrative('gameStart')

      expect(callback).toHaveBeenCalledWith(mockNarrativeEvents[0])
      expect(mockNarrativeEvents[0].isViewed).toBe(true)
      expect(narrative.narrative.value.viewedEvents).toContain('gameStart')
    })

    it('should trigger content units events when threshold is met', () => {
      const narrative = useNarrative(mockNarrativeEvents)
      const callback = vi.fn()
      narrative.onNarrativeEvent(callback)

      narrative.triggerNarrative('contentUnits', 1)

      expect(callback).toHaveBeenCalledWith(mockNarrativeEvents[1])
      expect(mockNarrativeEvents[1].isViewed).toBe(true)
    })

    it('should not trigger content units events when threshold is not met', () => {
      const narrative = useNarrative(mockNarrativeEvents)
      const callback = vi.fn()
      narrative.onNarrativeEvent(callback)

      narrative.triggerNarrative('contentUnits', 0.5)

      expect(callback).not.toHaveBeenCalled()
      expect(mockNarrativeEvents[1].isViewed).toBe(false)
    })

    it('should trigger conditional events with matching conditions', () => {
      const narrative = useNarrative(mockNarrativeEvents)
      const callback = vi.fn()
      narrative.onNarrativeEvent(callback)

      narrative.triggerNarrative('generatorPurchase', undefined, 'basicAdBotFarm')

      expect(callback).toHaveBeenCalledWith(mockNarrativeEvents[3])
      expect(mockNarrativeEvents[3].isViewed).toBe(true)
    })

    it('should not trigger conditional events with non-matching conditions', () => {
      const narrative = useNarrative(mockNarrativeEvents)
      const callback = vi.fn()
      narrative.onNarrativeEvent(callback)

      narrative.triggerNarrative('generatorPurchase', undefined, 'wrongGenerator')

      expect(callback).not.toHaveBeenCalled()
      expect(mockNarrativeEvents[3].isViewed).toBe(false)
    })
  })

  describe('Event Priority and Multiple Triggers', () => {
    it('should trigger multiple eligible events in priority order', () => {
      const narrative = useNarrative(mockNarrativeEvents)
      const callback = vi.fn()
      narrative.onNarrativeEvent(callback)

      // This should trigger both firstClick (value=1) and highValue (value=100) events
      narrative.triggerNarrative('contentUnits', 150)

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenNthCalledWith(1, mockNarrativeEvents[1]) // firstClick (priority 900)
      expect(callback).toHaveBeenNthCalledWith(2, mockNarrativeEvents[2]) // highValue (priority 800)
    })

    it('should not trigger already viewed events', () => {
      const narrative = useNarrative(mockNarrativeEvents)
      const callback = vi.fn()
      narrative.onNarrativeEvent(callback)

      // Trigger once
      narrative.triggerNarrative('gameStart')
      expect(callback).toHaveBeenCalledTimes(1)

      // Try to trigger again
      callback.mockClear()
      narrative.triggerNarrative('gameStart')
      expect(callback).not.toHaveBeenCalled()
    })

    it('should handle events with no triggerValue or triggerCondition', () => {
      const narrative = useNarrative(mockNarrativeEvents)
      const callback = vi.fn()
      narrative.onNarrativeEvent(callback)

      narrative.triggerNarrative('gameStart')

      expect(callback).toHaveBeenCalledWith(mockNarrativeEvents[0])
    })
  })

  describe('Societal Stability', () => {
    it('should apply societal stability impact', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      narrative.triggerNarrative('gameStart') // -5 impact

      expect(narrative.narrative.value.societalStability).toBe(95)
    })

    it('should accumulate multiple stability impacts', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      narrative.triggerNarrative('gameStart') // -5 impact
      narrative.triggerNarrative('contentUnits', 1) // -1 impact

      expect(narrative.narrative.value.societalStability).toBe(94)
    })

    it('should not go below 0', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      // Set up extreme negative impact
      mockNarrativeEvents[0].societalStabilityImpact = -150

      narrative.triggerNarrative('gameStart')

      expect(narrative.narrative.value.societalStability).toBe(0)
    })

    it('should not go above 100', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      // Set up positive impact
      mockNarrativeEvents[0].societalStabilityImpact = 50

      narrative.triggerNarrative('gameStart')

      expect(narrative.narrative.value.societalStability).toBe(100)
    })
  })

  describe('Pending Events Management', () => {
    it('should add triggered events to pending queue', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      narrative.triggerNarrative('gameStart')

      expect(narrative.narrative.value.pendingEvents).toHaveLength(1)
      expect(narrative.narrative.value.pendingEvents[0]).toEqual(mockNarrativeEvents[0])
    })

    it('should check if events are pending', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      expect(narrative.hasPendingEvents()).toBe(false)

      narrative.triggerNarrative('gameStart')

      expect(narrative.hasPendingEvents()).toBe(true)
    })

    it('should get and remove next pending event', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      narrative.triggerNarrative('gameStart')
      narrative.triggerNarrative('contentUnits', 1)

      expect(narrative.narrative.value.pendingEvents).toHaveLength(2)

      const firstEvent = narrative.getNextPendingEvent()
      expect(firstEvent).toEqual(mockNarrativeEvents[0])
      expect(narrative.narrative.value.pendingEvents).toHaveLength(1)

      const secondEvent = narrative.getNextPendingEvent()
      expect(secondEvent).toEqual(mockNarrativeEvents[1])
      expect(narrative.narrative.value.pendingEvents).toHaveLength(0)

      const noEvent = narrative.getNextPendingEvent()
      expect(noEvent).toBeNull()
    })
  })

  describe('Prestige Reset', () => {
    it('should clear pending events on prestige reset', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      narrative.triggerNarrative('gameStart')
      narrative.triggerNarrative('contentUnits', 1)

      expect(narrative.narrative.value.pendingEvents).toHaveLength(2)

      narrative.resetForPrestige()

      expect(narrative.narrative.value.pendingEvents).toHaveLength(0)
    })

    it('should preserve viewed events and societal stability after prestige', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      narrative.triggerNarrative('gameStart')

      expect(narrative.narrative.value.viewedEvents).toContain('gameStart')
      expect(narrative.narrative.value.societalStability).toBe(95)

      narrative.resetForPrestige()

      expect(narrative.narrative.value.viewedEvents).toContain('gameStart')
      expect(narrative.narrative.value.societalStability).toBe(95)
    })
  })

  describe('Game Loop Integration Helpers', () => {
    it('should manage content units check tracking', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      expect(narrative.getLastContentUnitsCheck()).toBe(0)

      narrative.setLastContentUnitsCheck(50)

      expect(narrative.getLastContentUnitsCheck()).toBe(50)
      expect(narrative.lastContentUnitsCheck.value).toBe(50)
    })

    it('should provide game start time', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      const startTime = narrative.getGameStartTime()

      expect(startTime).toBeGreaterThan(0)
      expect(startTime).toBe(narrative.narrative.value.gameStartTime)
    })

    it('should manage game start trigger tracking', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      expect(narrative.getHasTriggeredGameStart()).toBe(false)

      narrative.setHasTriggeredGameStart(true)

      expect(narrative.getHasTriggeredGameStart()).toBe(true)
      expect(narrative.hasTriggeredGameStart.value).toBe(true)
    })
  })

  describe('Direct Event Triggering', () => {
    it('should trigger specific narrative event directly', () => {
      const narrative = useNarrative(mockNarrativeEvents)
      const callback = vi.fn()
      narrative.onNarrativeEvent(callback)

      narrative.triggerNarrativeEvent(mockNarrativeEvents[0])

      expect(callback).toHaveBeenCalledWith(mockNarrativeEvents[0])
      expect(mockNarrativeEvents[0].isViewed).toBe(true)
      expect(narrative.narrative.value.viewedEvents).toContain('gameStart')
      expect(narrative.narrative.value.societalStability).toBe(95)
      expect(narrative.narrative.value.pendingEvents).toEqual([mockNarrativeEvents[0]])
    })

    it('should call all subscribers when triggering event', () => {
      const narrative = useNarrative(mockNarrativeEvents)
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      narrative.onNarrativeEvent(callback1)
      narrative.onNarrativeEvent(callback2)

      narrative.triggerNarrativeEvent(mockNarrativeEvents[0])

      expect(callback1).toHaveBeenCalledWith(mockNarrativeEvents[0])
      expect(callback2).toHaveBeenCalledWith(mockNarrativeEvents[0])
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty narrative events array', () => {
      const narrative = useNarrative([])

      expect(() => narrative.triggerNarrative('gameStart')).not.toThrow()
      expect(narrative.hasPendingEvents()).toBe(false)
    })

    it('should handle undefined trigger values gracefully', () => {
      const narrative = useNarrative(mockNarrativeEvents)
      const callback = vi.fn()
      narrative.onNarrativeEvent(callback)

      narrative.triggerNarrative('contentUnits', undefined)

      expect(callback).not.toHaveBeenCalled()
    })

    it('should handle events with extreme priority values', () => {
      const testEvents = [
        { ...mockNarrativeEvents[0], priority: Number.MAX_SAFE_INTEGER },
        { ...mockNarrativeEvents[1], priority: -Number.MAX_SAFE_INTEGER },
        { ...mockNarrativeEvents[2], priority: 0 },
      ]

      const narrative = useNarrative(testEvents)
      const callback = vi.fn()
      narrative.onNarrativeEvent(callback)

      narrative.triggerNarrative('contentUnits', 150)

      // Should be called in priority order (highest first)
      expect(callback).toHaveBeenNthCalledWith(1, testEvents[2]) // priority 0
      expect(callback).toHaveBeenNthCalledWith(2, testEvents[1]) // priority -MAX
    })

    it('should handle events with same priority consistently', () => {
      const testEvents = [
        {
          ...mockNarrativeEvents[0],
          id: 'event1',
          triggerType: 'contentUnits',
          triggerValue: 1,
          priority: 100,
        },
        {
          ...mockNarrativeEvents[1],
          id: 'event2',
          triggerType: 'contentUnits',
          triggerValue: 1,
          priority: 100,
        },
      ]

      const narrative = useNarrative(testEvents)
      const callback = vi.fn()
      narrative.onNarrativeEvent(callback)

      narrative.triggerNarrative('contentUnits', 1)

      expect(callback).toHaveBeenCalledTimes(2)
      // Order should be consistent (based on array order when priorities are equal)
    })

    it('should handle concurrent modifications safely', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      // Simulate modifying events while processing
      const callback = vi.fn(() => {
        mockNarrativeEvents.push({
          id: 'newEvent',
          title: 'New Event',
          content: 'New content',
          triggerType: 'gameStart',
          societalStabilityImpact: 0,
          priority: 1,
          isViewed: false,
        })
      })

      narrative.onNarrativeEvent(callback)

      expect(() => narrative.triggerNarrative('gameStart')).not.toThrow()
    })
  })
})
