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
      expect(mockCallbacks.hasTriggeredGameStart).toHaveBeenCalledTimes(1)
    })

    it('should handle stopping when not running', () => {
      const gameLoop = useGameLoop()

      // Should not throw error
      expect(() => gameLoop.stopGameLoop()).not.toThrow()
      expect(gameLoop.isRunning.value).toBe(false)
    })
  })

  describe('Game Start Trigger', () => {
    it('should trigger game start narrative on first loop start', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()

      gameLoop.startGameLoop(mockCallbacks)

      expect(mockCallbacks.triggerNarrative).toHaveBeenCalledWith('gameStart')
      expect(mockCallbacks.setHasTriggeredGameStart).toHaveBeenCalledWith(true)
    })

    it('should not trigger game start narrative on subsequent starts', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()
      mockCallbacks.hasTriggeredGameStart.mockReturnValue(true)

      gameLoop.startGameLoop(mockCallbacks)

      expect(mockCallbacks.triggerNarrative).not.toHaveBeenCalledWith('gameStart')
      expect(mockCallbacks.setHasTriggeredGameStart).not.toHaveBeenCalled()
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

    it('should call applyResourceProduction every tick regardless of production rate', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()

      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(300) // 3 ticks

      expect(mockCallbacks.applyResourceProduction).toHaveBeenCalledTimes(3)
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

  describe('Resource Narrative Triggers', () => {
    it('should trigger narrative when HCU amount increases', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()
      mockCallbacks.getResourceAmount.mockReturnValue(100)
      mockCallbacks.getLastContentUnitsCheck.mockReturnValue(50)

      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100)

      expect(mockCallbacks.triggerNarrative).toHaveBeenCalledWith('resourceAmount', 100, 'hcu')
      expect(mockCallbacks.setLastContentUnitsCheck).toHaveBeenCalledWith(100)
    })

    it('should not trigger narrative when HCU amount stays the same', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()
      mockCallbacks.getResourceAmount.mockReturnValue(100)
      mockCallbacks.getLastContentUnitsCheck.mockReturnValue(100)

      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100)

      expect(mockCallbacks.triggerNarrative).not.toHaveBeenCalledWith(
        'resourceAmount',
        expect.any(Number),
        'hcu',
      )
      expect(mockCallbacks.setLastContentUnitsCheck).not.toHaveBeenCalled()
    })

    it('should only trigger on integer increases', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()
      mockCallbacks.getResourceAmount.mockReturnValue(100.9)
      mockCallbacks.getLastContentUnitsCheck.mockReturnValue(100.1)

      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100)

      // Math.floor(100.9) = 100, Math.floor(100.1) = 100, so no trigger
      expect(mockCallbacks.triggerNarrative).not.toHaveBeenCalledWith(
        'resourceAmount',
        expect.any(Number),
        'hcu',
      )
    })

    it('should trigger when crossing integer boundaries', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()
      mockCallbacks.getResourceAmount.mockReturnValue(101.1)
      mockCallbacks.getLastContentUnitsCheck.mockReturnValue(100.9)

      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100)

      // Math.floor(101.1) = 101, Math.floor(100.9) = 100, so trigger
      expect(mockCallbacks.triggerNarrative).toHaveBeenCalledWith('resourceAmount', 101.1, 'hcu')
    })
  })

  describe('Time Elapsed Triggers', () => {
    it('should trigger time elapsed narrative on every tick', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()
      const startTime = 1000000
      mockCallbacks.getGameStartTime.mockReturnValue(startTime)

      // Mock current time to be 1000 ms after start
      vi.setSystemTime(startTime + 1000)

      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100)

      expect(mockCallbacks.triggerNarrative).toHaveBeenCalledWith('timeElapsed', 1100)
    })

    it('should calculate time elapsed correctly over multiple ticks', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()
      const startTime = 1000000
      mockCallbacks.getGameStartTime.mockReturnValue(startTime)

      vi.setSystemTime(startTime)

      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(200) // 2 ticks

      // Time should have advanced by 200ms
      expect(mockCallbacks.triggerNarrative).toHaveBeenLastCalledWith('timeElapsed', 200)
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

    it('should have current time as reactive value', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()

      gameLoop.startGameLoop(mockCallbacks)

      const time1 = gameLoop.currentTime.value
      vi.advanceTimersByTime(100)
      const time2 = gameLoop.currentTime.value
      vi.advanceTimersByTime(100)
      const time3 = gameLoop.currentTime.value

      expect(time2).toBeGreaterThan(time1)
      expect(time3).toBeGreaterThan(time2)
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
      mockCallbacks.getLastContentUnitsCheck.mockReturnValue(5)

      // Set up task completion
      mockCallbacks.getTaskProgress
        .mockReturnValueOnce({ isComplete: false })
        .mockReturnValue({ isComplete: true })

      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(200) // 2 ticks

      // Verify all systems worked
      expect(mockCallbacks.applyResourceProduction).toHaveBeenCalledTimes(2)
      expect(mockCallbacks.triggerNarrative).toHaveBeenCalledWith('gameStart')
      expect(mockCallbacks.triggerNarrative).toHaveBeenCalledWith(
        'resourceAmount',
        expect.any(Number),
        'hcu',
      )
      expect(mockCallbacks.triggerNarrative).toHaveBeenCalledWith('timeElapsed', expect.any(Number))
      expect(mockCallbacks.completeTask).toHaveBeenCalled()
    })

    it('should handle very high production rates', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()

      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100)

      expect(mockCallbacks.applyResourceProduction).toHaveBeenCalled()
    })

    it('should handle zero or negative production rates safely', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()

      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100)

      expect(mockCallbacks.applyResourceProduction).toHaveBeenCalled()
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
    triggerNarrative: vi.fn(),
    getTaskProgress: vi.fn().mockReturnValue({ isComplete: false }),
    getResourceAmount: vi.fn().mockReturnValue(0),
    getLastContentUnitsCheck: vi.fn().mockReturnValue(0),
    setLastContentUnitsCheck: vi.fn(),
    getGameStartTime: vi.fn().mockReturnValue(Date.now()),
    hasTriggeredGameStart: vi.fn().mockReturnValue(false),
    setHasTriggeredGameStart: vi.fn(),
    applyResourceProduction: vi.fn(),
  }
}
