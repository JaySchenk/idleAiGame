import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNarrative } from '../useNarrative'
import type { NarrativeEvent } from '../../config/narratives'
import type { GameState } from '../../stores/gameStore'

// Mock the UnlockSystem
vi.mock('../../game/unlockSystem', () => ({
  UnlockSystem: {
    checkConditions: vi.fn(),
  },
}))

import { UnlockSystem } from '../../game/unlockSystem'

describe('useNarrative', () => {
  let mockNarrativeEvents: NarrativeEvent[]
  let mockGameState: GameState

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Create fresh mock data for each test
    mockNarrativeEvents = [
      {
        id: 'gameStart',
        title: 'The AI Awakens',
        content: 'Test game start content',
        unlockConditions: [{ type: 'time', minPlayTime: 0 }],
        societalStabilityImpact: -5,
        priority: 1000,
        isViewed: false,
      },
      {
        id: 'firstClick',
        title: 'Manual Override',
        content: 'Test first click content',
        unlockConditions: [{ type: 'resource', resourceId: 'hcu', minAmount: 1 }],
        societalStabilityImpact: -1,
        priority: 900,
        isViewed: false,
      },
      {
        id: 'highValue',
        title: 'High Value Event',
        content: 'Test high value content',
        unlockConditions: [{ type: 'resource', resourceId: 'hcu', minAmount: 100 }],
        societalStabilityImpact: -10,
        priority: 800,
        isViewed: false,
      },
      {
        id: 'generatorEvent',
        title: 'Generator Purchase',
        content: 'Test generator content',
        unlockConditions: [{ type: 'generator', generatorId: 'basicAdBotFarm', minOwned: 1 }],
        societalStabilityImpact: -15,
        priority: 750,
        isViewed: false,
      },
    ]

    // Mock game state
    mockGameState = {
      resources: {
        hcu: { current: 50, lifetime: 100 },
      },
      generators: [{ id: 'basicAdBotFarm', owned: 1, name: 'Basic Ad-Bot Farm' }],
      upgrades: [],
      narratives: [],
      prestige: { level: 0 },
    } as GameState
  })

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      expect(narrative.narrative.value.currentStoryEvents).toHaveLength(4)
      expect(narrative.narrative.value.viewedEvents).toEqual([])
      expect(narrative.narrative.value.pendingEvents).toEqual([])
      expect(narrative.narrative.value.isNarrativeActive).toBe(false)
      expect(narrative.narrative.value.gameStartTime).toBeGreaterThan(0)
    })

    it('should initialize tracking state correctly', () => {
      const narrative = useNarrative(mockNarrativeEvents)

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

  describe('Narrative Checking with Unlock System', () => {
    it('should check unlock conditions for all narratives', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      // Mock all narratives as locked
      vi.mocked(UnlockSystem.checkConditions).mockReturnValue({
        isUnlocked: false,
        isVisible: true,
        failedConditions: [],
      })

      narrative.checkAndTriggerNarratives(mockGameState)

      // Should check conditions for all non-viewed narratives
      expect(UnlockSystem.checkConditions).toHaveBeenCalledTimes(4)
    })

    it('should trigger eligible narratives based on unlock conditions', () => {
      const narrative = useNarrative(mockNarrativeEvents)
      const callback = vi.fn()
      narrative.onNarrativeEvent(callback)

      // Mock first narrative as unlocked, others as locked
      vi.mocked(UnlockSystem.checkConditions)
        .mockReturnValueOnce({
          isUnlocked: true,
          isVisible: true,
          failedConditions: [],
        })
        .mockReturnValue({
          isUnlocked: false,
          isVisible: true,
          failedConditions: [],
        })

      narrative.checkAndTriggerNarratives(mockGameState)

      expect(callback).toHaveBeenCalledWith(mockNarrativeEvents[0])
      expect(mockNarrativeEvents[0].isViewed).toBe(true)
      expect(narrative.narrative.value.viewedEvents).toContain('gameStart')
    })

    it('should trigger multiple eligible narratives in priority order', () => {
      const narrative = useNarrative(mockNarrativeEvents)
      const callback = vi.fn()
      narrative.onNarrativeEvent(callback)

      // Mock first two narratives as unlocked
      vi.mocked(UnlockSystem.checkConditions)
        .mockReturnValueOnce({
          isUnlocked: true,
          isVisible: true,
          failedConditions: [],
        })
        .mockReturnValueOnce({
          isUnlocked: true,
          isVisible: true,
          failedConditions: [],
        })
        .mockReturnValue({
          isUnlocked: false,
          isVisible: true,
          failedConditions: [],
        })

      narrative.checkAndTriggerNarratives(mockGameState)

      expect(callback).toHaveBeenCalledTimes(2)
      // Should be called in priority order (highest first)
      expect(callback).toHaveBeenNthCalledWith(1, mockNarrativeEvents[0]) // priority 1000
      expect(callback).toHaveBeenNthCalledWith(2, mockNarrativeEvents[1]) // priority 900
    })

    it('should not trigger already viewed narratives', () => {
      const narrative = useNarrative(mockNarrativeEvents)
      const callback = vi.fn()
      narrative.onNarrativeEvent(callback)

      // Mark first narrative as viewed
      mockNarrativeEvents[0].isViewed = true

      // Mock as unlocked
      vi.mocked(UnlockSystem.checkConditions).mockReturnValue({
        isUnlocked: true,
        isVisible: true,
        failedConditions: [],
      })

      narrative.checkAndTriggerNarratives(mockGameState)

      // Should not check conditions for viewed narratives
      expect(UnlockSystem.checkConditions).toHaveBeenCalledTimes(3)
      expect(callback).not.toHaveBeenCalledWith(mockNarrativeEvents[0])
    })

    it('should pass correct unlock conditions to UnlockSystem', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      vi.mocked(UnlockSystem.checkConditions).mockReturnValue({
        isUnlocked: false,
        isVisible: true,
        failedConditions: [],
      })

      narrative.checkAndTriggerNarratives(mockGameState)

      // Check that correct unlock conditions were passed
      expect(UnlockSystem.checkConditions).toHaveBeenCalledWith(
        mockNarrativeEvents[0].unlockConditions,
        mockGameState,
      )
      expect(UnlockSystem.checkConditions).toHaveBeenCalledWith(
        mockNarrativeEvents[1].unlockConditions,
        mockGameState,
      )
    })
  })

  describe('Pending Events Management', () => {
    it('should add triggered events to pending queue', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      narrative.triggerNarrativeEvent(mockNarrativeEvents[0])

      expect(narrative.narrative.value.pendingEvents).toHaveLength(1)
      expect(narrative.narrative.value.pendingEvents[0]).toEqual(mockNarrativeEvents[0])
    })

    it('should check if events are pending', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      expect(narrative.hasPendingEvents()).toBe(false)

      narrative.triggerNarrativeEvent(mockNarrativeEvents[0])

      expect(narrative.hasPendingEvents()).toBe(true)
    })

    it('should get and remove next pending event', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      narrative.triggerNarrativeEvent(mockNarrativeEvents[0])
      narrative.triggerNarrativeEvent(mockNarrativeEvents[1])

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

      narrative.triggerNarrativeEvent(mockNarrativeEvents[0])
      narrative.triggerNarrativeEvent(mockNarrativeEvents[1])

      expect(narrative.narrative.value.pendingEvents).toHaveLength(2)

      narrative.resetForPrestige()

      expect(narrative.narrative.value.pendingEvents).toHaveLength(0)
    })

    it('should preserve viewed events and societal stability after prestige', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      narrative.triggerNarrativeEvent(mockNarrativeEvents[0])

      expect(narrative.narrative.value.viewedEvents).toContain('gameStart')

      narrative.resetForPrestige()

      expect(narrative.narrative.value.viewedEvents).toContain('gameStart')
    })
  })

  describe('Game Loop Integration Helpers', () => {
    it('should provide game start time', () => {
      const narrative = useNarrative(mockNarrativeEvents)

      const startTime = narrative.getGameStartTime()

      expect(startTime).toBeGreaterThan(0)
      expect(startTime).toBe(narrative.narrative.value.gameStartTime)
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
      expect(narrative.narrative.value.pendingEvents).toEqual([mockNarrativeEvents[0]])
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty narrative events array', () => {
      const narrative = useNarrative([])

      expect(() => narrative.checkAndTriggerNarratives(mockGameState)).not.toThrow()
      expect(narrative.hasPendingEvents()).toBe(false)
    })

    it('should handle narratives with empty unlock conditions', () => {
      const narrativeWithEmptyConditions: NarrativeEvent = {
        id: 'test',
        title: 'Test',
        content: 'Test content',
        unlockConditions: [],
        societalStabilityImpact: 0,
        priority: 100,
        isViewed: false,
      }

      const narrative = useNarrative([narrativeWithEmptyConditions])

      // Empty conditions should always return unlocked
      vi.mocked(UnlockSystem.checkConditions).mockReturnValue({
        isUnlocked: true,
        isVisible: true,
        failedConditions: [],
      })

      narrative.checkAndTriggerNarratives(mockGameState)

      expect(UnlockSystem.checkConditions).toHaveBeenCalledWith([], mockGameState)
    })
  })
})
