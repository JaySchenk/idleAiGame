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

  describe('Passive Income Generation', () => {
    it('should add content units based on production rate', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()
      mockCallbacks.getProductionRate.mockReturnValue(100) // 100 HCU per second
      
      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100) // Advance one tick
      
      // Expected: (100 * 100) / 1000 = 10 HCU per tick
      expect(mockCallbacks.addContentUnits).toHaveBeenCalledWith(10)
    })

    it('should not add content units when production rate is zero', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()
      mockCallbacks.getProductionRate.mockReturnValue(0)
      
      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100)
      
      expect(mockCallbacks.addContentUnits).not.toHaveBeenCalled()
    })

    it('should handle fractional production rates correctly', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()
      mockCallbacks.getProductionRate.mockReturnValue(0.5) // 0.5 HCU per second
      
      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100)
      
      // Expected: (0.5 * 100) / 1000 = 0.05 HCU per tick
      expect(mockCallbacks.addContentUnits).toHaveBeenCalledWith(0.05)
    })

    it('should accumulate production over multiple ticks', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()
      mockCallbacks.getProductionRate.mockReturnValue(10) // 10 HCU per second
      
      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(300) // 3 ticks
      
      // Should have been called 3 times with 1 HCU each
      expect(mockCallbacks.addContentUnits).toHaveBeenCalledTimes(3)
      expect(mockCallbacks.addContentUnits).toHaveBeenNthCalledWith(1, 1)
      expect(mockCallbacks.addContentUnits).toHaveBeenNthCalledWith(2, 1)
      expect(mockCallbacks.addContentUnits).toHaveBeenNthCalledWith(3, 1)
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

  describe('Content Units Narrative Triggers', () => {
    it('should trigger narrative when content units increase', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()
      mockCallbacks.getContentUnits.mockReturnValue(100)
      mockCallbacks.getLastContentUnitsCheck.mockReturnValue(50)
      
      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100)
      
      expect(mockCallbacks.triggerNarrative).toHaveBeenCalledWith('contentUnits', 100)
      expect(mockCallbacks.setLastContentUnitsCheck).toHaveBeenCalledWith(100)
    })

    it('should not trigger narrative when content units stay the same', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()
      mockCallbacks.getContentUnits.mockReturnValue(100)
      mockCallbacks.getLastContentUnitsCheck.mockReturnValue(100)
      
      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100)
      
      expect(mockCallbacks.triggerNarrative).not.toHaveBeenCalledWith('contentUnits', expect.any(Number))
      expect(mockCallbacks.setLastContentUnitsCheck).not.toHaveBeenCalled()
    })

    it('should only trigger on integer increases', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()
      mockCallbacks.getContentUnits.mockReturnValue(100.9)
      mockCallbacks.getLastContentUnitsCheck.mockReturnValue(100.1)
      
      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100)
      
      // Math.floor(100.9) = 100, Math.floor(100.1) = 100, so no trigger
      expect(mockCallbacks.triggerNarrative).not.toHaveBeenCalledWith('contentUnits', expect.any(Number))
    })

    it('should trigger when crossing integer boundaries', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()
      mockCallbacks.getContentUnits.mockReturnValue(101.1)
      mockCallbacks.getLastContentUnitsCheck.mockReturnValue(100.9)
      
      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100)
      
      // Math.floor(101.1) = 101, Math.floor(100.9) = 100, so trigger
      expect(mockCallbacks.triggerNarrative).toHaveBeenCalledWith('contentUnits', 101.1)
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
      
      // Set up production
      mockCallbacks.getProductionRate.mockReturnValue(50) // 50 HCU/sec
      
      // Set up content progression
      mockCallbacks.getContentUnits
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
      expect(mockCallbacks.addContentUnits).toHaveBeenCalledTimes(2)
      expect(mockCallbacks.triggerNarrative).toHaveBeenCalledWith('gameStart')
      expect(mockCallbacks.triggerNarrative).toHaveBeenCalledWith('contentUnits', expect.any(Number))
      expect(mockCallbacks.triggerNarrative).toHaveBeenCalledWith('timeElapsed', expect.any(Number))
      expect(mockCallbacks.completeTask).toHaveBeenCalled()
    })

    it('should handle very high production rates', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()
      mockCallbacks.getProductionRate.mockReturnValue(1000000) // 1M HCU/sec
      
      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100)
      
      expect(mockCallbacks.addContentUnits).toHaveBeenCalledWith(100000)
    })

    it('should handle zero or negative production rates safely', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()
      mockCallbacks.getProductionRate.mockReturnValue(-10)
      
      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100)
      
      expect(mockCallbacks.addContentUnits).not.toHaveBeenCalled()
    })

    it('should stop cleanly and not continue processing', () => {
      const gameLoop = useGameLoop()
      const mockCallbacks = createMockCallbacks()
      mockCallbacks.getProductionRate.mockReturnValue(10)
      
      gameLoop.startGameLoop(mockCallbacks)
      vi.advanceTimersByTime(100)
      
      const callsAfterFirstTick = mockCallbacks.addContentUnits.mock.calls.length
      
      gameLoop.stopGameLoop()
      vi.advanceTimersByTime(100)
      
      const callsAfterStop = mockCallbacks.addContentUnits.mock.calls.length
      
      expect(callsAfterStop).toBe(callsAfterFirstTick)
    })
  })
})

/**
 * Helper to create mock callbacks for testing
 */
function createMockCallbacks() {
  return {
    addContentUnits: vi.fn(),
    completeTask: vi.fn().mockReturnValue(true),
    triggerNarrative: vi.fn(),
    getProductionRate: vi.fn().mockReturnValue(0),
    getTaskProgress: vi.fn().mockReturnValue({ isComplete: false }),
    getContentUnits: vi.fn().mockReturnValue(0),
    getLastContentUnitsCheck: vi.fn().mockReturnValue(0),
    setLastContentUnitsCheck: vi.fn(),
    getGameStartTime: vi.fn().mockReturnValue(Date.now()),
    hasTriggeredGameStart: vi.fn().mockReturnValue(false),
    setHasTriggeredGameStart: vi.fn()
  }
}