import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useGameLoop } from '../useGameLoop'

describe('useGameLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const gameLoop = useGameLoop()

      expect(gameLoop.isRunning.value).toBe(false)
      expect(gameLoop.tickRate).toBe(100)
      expect(typeof gameLoop.currentTime.value).toBe('number')
    })

    it('should have current time as a reactive ref', () => {
      const gameLoop = useGameLoop()

      expect(gameLoop.currentTime.value).toBeGreaterThan(0)
    })
  })

  describe('Game Loop Management', () => {
    it('should start the game loop correctly', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()

      gameLoop.startGameLoop(mockCallbacks)

      expect(gameLoop.isRunning.value).toBe(true)
    })

    it('should stop the game loop correctly', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()

      gameLoop.startGameLoop(mockCallbacks)
      gameLoop.stopGameLoop()

      expect(gameLoop.isRunning.value).toBe(false)
    })

    it('should not start multiple loops', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()

      gameLoop.startGameLoop(mockCallbacks)
      const firstState = gameLoop.isRunning.value

      gameLoop.startGameLoop(mockCallbacks)
      const secondState = gameLoop.isRunning.value

      expect(firstState).toBe(true)
      expect(secondState).toBe(true)
    })

    it('should handle stopping when not running', () => {
      const gameLoop = useGameLoop()

      // Should not throw error
      expect(() => gameLoop.stopGameLoop()).not.toThrow()
      expect(gameLoop.isRunning.value).toBe(false)
    })
  })

  describe('Game Loop Management Extended', () => {
    it('should start game loop without errors', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()

      gameLoop.startGameLoop(mockCallbacks)

      expect(gameLoop.isRunning.value).toBe(true)
    })

    it('should not start multiple loops', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()

      gameLoop.startGameLoop(mockCallbacks)
      const firstState = gameLoop.isRunning.value

      gameLoop.startGameLoop(mockCallbacks)
      const secondState = gameLoop.isRunning.value

      expect(firstState).toBe(true)
      expect(secondState).toBe(true)
    })
  })

  describe('Resource Production', () => {
    it('should apply resource production on each tick', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()

      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100) // Advance one tick

      expect(mockCallbacks.applyResourceProduction).toHaveBeenCalled()
    })
  })

  describe('Task System Integration', () => {
    it('should complete tasks when they are ready', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()
      mockCallbacks.getTaskProgress.mockReturnValue({ isComplete: true })

      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100)

      expect(mockCallbacks.completeTask).toHaveBeenCalled()
    })

    it('should not complete tasks when they are not ready', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()
      mockCallbacks.getTaskProgress.mockReturnValue({ isComplete: false })

      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100)

      expect(mockCallbacks.completeTask).not.toHaveBeenCalled()
    })

    it('should check task completion on every tick', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()
      mockCallbacks.getTaskProgress
        .mockReturnValueOnce({ isComplete: false })
        .mockReturnValueOnce({ isComplete: true })
        .mockReturnValue({ isComplete: false })

      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(300) // 3 ticks

      expect(mockCallbacks.getTaskProgress).toHaveBeenCalledTimes(3)
      expect(mockCallbacks.completeTask).toHaveBeenCalledTimes(1)
    })
  })

  describe('Narrative System Integration', () => {
    it('should check narratives on each tick', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()

      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100)

      expect(mockCallbacks.checkAndTriggerNarratives).toHaveBeenCalledWith({})
    })
  })

  describe('Current Time Updates', () => {
    it('should update current time on every tick', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()

      const initialTime = gameLoop.currentTime.value

      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100)

      expect(gameLoop.currentTime.value).toBeGreaterThan(initialTime)
    })
  })

  describe('Integration and Edge Cases', () => {
    it('should handle all systems working together', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()

      // Production is now handled via applyResourceProduction callback

      // Set up HCU progression
      mockCallbacks.getResourceAmount
        .mockReturnValueOnce(10)
        .mockReturnValueOnce(15)
        .mockReturnValue(20)

      // Set up task completion
      mockCallbacks.getTaskProgress
        .mockReturnValueOnce({ isComplete: false })
        .mockReturnValue({ isComplete: true })

      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(200) // 2 ticks

      // Verify all systems worked
      expect(mockCallbacks.applyResourceProduction).toHaveBeenCalledTimes(2)
      expect(mockCallbacks.checkAndTriggerNarratives).toHaveBeenCalledWith({})
      expect(mockCallbacks.completeTask).toHaveBeenCalled()
    })

    it('should stop cleanly and not continue processing', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()

      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100)

      const callsAfterFirstTick = mockCallbacks.addResource.mock.calls.length

      gameLoop.stopGameLoop()
      vi.advanceTimersByTime(100)

      const callsAfterStop = mockCallbacks.addResource.mock.calls.length

      expect(callsAfterStop).toBe(callsAfterFirstTick)
    })
  })
})

/**
 * Helper to create mock callbacks for testing
 */
function createMockCallbacks() {
  return {
    addResource: vi.fn(),
    completeTask: vi.fn().mockReturnValue(true),
    checkAndTriggerNarratives: vi.fn(),
    getTaskProgress: vi.fn().mockReturnValue({ isComplete: false }),
    getResourceAmount: vi.fn().mockReturnValue(0),
    getGameStartTime: vi.fn().mockReturnValue(Date.now()),
    applyResourceProduction: vi.fn(),
    getCurrentTime: vi.fn().mockReturnValue(Date.now()),
    getGameState: vi.fn().mockReturnValue({}),
  }
}
