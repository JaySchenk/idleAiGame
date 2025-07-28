import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTaskSystem } from '../useTaskSystem'

describe('useTaskSystem', () => {
  let mockCurrentTime: ReturnType<typeof vi.fn>
  let baseTime: number

  beforeEach(() => {
    baseTime = 1000000 // Fixed base time for consistent testing
    mockCurrentTime = vi.fn().mockReturnValue(baseTime)
  })

  describe('Initialization', () => {
    it('should initialize with correct constants', () => {
      const taskSystem = useTaskSystem(mockCurrentTime)
      
      expect(taskSystem.taskDuration).toBe(30000) // 30 seconds
      expect(taskSystem.taskReward).toBe(10)
    })

    it('should initialize with a task start time', () => {
      const taskSystem = useTaskSystem(mockCurrentTime)
      
      expect(taskSystem.taskStartTime.value).toBeGreaterThan(0)
    })

    it('should have reactive task start time', () => {
      const taskSystem = useTaskSystem(mockCurrentTime)
      
      const initialTime = taskSystem.taskStartTime.value
      taskSystem.taskStartTime.value = baseTime + 5000
      
      expect(taskSystem.taskStartTime.value).toBe(baseTime + 5000)
      expect(taskSystem.taskStartTime.value).not.toBe(initialTime)
    })
  })

  describe('Task Progress Calculations', () => {
    it('should calculate progress correctly at start', () => {
      const taskSystem = useTaskSystem(mockCurrentTime)
      taskSystem.taskStartTime.value = baseTime
      
      const progress = taskSystem.taskProgress.value
      
      expect(progress.timeElapsed).toBe(0)
      expect(progress.timeRemaining).toBe(30000)
      expect(progress.progressPercent).toBe(0)
      expect(progress.isComplete).toBe(false)
      expect(progress.rewardAmount).toBe(10)
      expect(progress.duration).toBe(30000)
    })

    it('should calculate progress correctly at 50% completion', () => {
      const taskSystem = useTaskSystem(mockCurrentTime)
      taskSystem.taskStartTime.value = baseTime
      mockCurrentTime.mockReturnValue(baseTime + 15000) // Half way through
      
      const progress = taskSystem.taskProgress.value
      
      expect(progress.timeElapsed).toBe(15000)
      expect(progress.timeRemaining).toBe(15000)
      expect(progress.progressPercent).toBe(50)
      expect(progress.isComplete).toBe(false)
    })

    it('should calculate progress correctly at completion', () => {
      const taskSystem = useTaskSystem(mockCurrentTime)
      taskSystem.taskStartTime.value = baseTime
      mockCurrentTime.mockReturnValue(baseTime + 30000) // Exactly complete
      
      const progress = taskSystem.taskProgress.value
      
      expect(progress.timeElapsed).toBe(30000)
      expect(progress.timeRemaining).toBe(0)
      expect(progress.progressPercent).toBe(100)
      expect(progress.isComplete).toBe(true)
    })

    it('should calculate progress correctly when overdue', () => {
      const taskSystem = useTaskSystem(mockCurrentTime)
      taskSystem.taskStartTime.value = baseTime
      mockCurrentTime.mockReturnValue(baseTime + 45000) // 15 seconds overdue
      
      const progress = taskSystem.taskProgress.value
      
      expect(progress.timeElapsed).toBe(45000)
      expect(progress.timeRemaining).toBe(0) // Should not go negative
      expect(progress.progressPercent).toBe(100) // Should cap at 100
      expect(progress.isComplete).toBe(true)
    })

    it('should handle very large time differences', () => {
      const taskSystem = useTaskSystem(mockCurrentTime)
      taskSystem.taskStartTime.value = baseTime
      mockCurrentTime.mockReturnValue(baseTime + 1000000) // Very far in future
      
      const progress = taskSystem.taskProgress.value
      
      expect(progress.timeElapsed).toBe(1000000)
      expect(progress.timeRemaining).toBe(0)
      expect(progress.progressPercent).toBe(100)
      expect(progress.isComplete).toBe(true)
    })

    it('should handle time going backwards gracefully', () => {
      const taskSystem = useTaskSystem(mockCurrentTime)
      taskSystem.taskStartTime.value = baseTime + 1000
      mockCurrentTime.mockReturnValue(baseTime) // Time goes backwards
      
      const progress = taskSystem.taskProgress.value
      
      expect(progress.timeElapsed).toBe(-1000)
      expect(progress.timeRemaining).toBe(31000) // Math.max(0, 30000 - (-1000)) = 31000
      expect(progress.progressPercent).toBeCloseTo(-3.33, 2) // Negative progress
      expect(progress.isComplete).toBe(false)
    })
  })

  describe('Task Completion', () => {
    it('should complete task when ready and grant reward', () => {
      const taskSystem = useTaskSystem(mockCurrentTime)
      const addContentUnits = vi.fn()
      
      taskSystem.taskStartTime.value = baseTime
      mockCurrentTime.mockReturnValue(baseTime + 30000) // Task complete
      
      const result = taskSystem.completeTask(addContentUnits)
      
      expect(result).toBe(true)
      expect(addContentUnits).toHaveBeenCalledWith(10)
    })

    it('should not complete task when not ready', () => {
      const taskSystem = useTaskSystem(mockCurrentTime)
      const addContentUnits = vi.fn()
      
      taskSystem.taskStartTime.value = baseTime
      mockCurrentTime.mockReturnValue(baseTime + 15000) // Only half complete
      
      const result = taskSystem.completeTask(addContentUnits)
      
      expect(result).toBe(false)
      expect(addContentUnits).not.toHaveBeenCalled()
    })

    it('should reset task start time after completion', () => {
      const taskSystem = useTaskSystem(mockCurrentTime)
      const addContentUnits = vi.fn()
      
      taskSystem.taskStartTime.value = baseTime
      mockCurrentTime.mockReturnValue(baseTime + 30000)
      
      const originalStartTime = taskSystem.taskStartTime.value
      taskSystem.completeTask(addContentUnits)
      
      expect(taskSystem.taskStartTime.value).toBe(baseTime + 30000) // Reset to current time
      expect(taskSystem.taskStartTime.value).not.toBe(originalStartTime)
    })

    it('should start new task immediately after completion', () => {
      const taskSystem = useTaskSystem(mockCurrentTime)
      const addContentUnits = vi.fn()
      
      taskSystem.taskStartTime.value = baseTime
      mockCurrentTime.mockReturnValue(baseTime + 30000)
      
      taskSystem.completeTask(addContentUnits)
      
      // New task should be at 0% progress
      const newProgress = taskSystem.taskProgress.value
      expect(newProgress.timeElapsed).toBe(0)
      expect(newProgress.progressPercent).toBe(0)
      expect(newProgress.isComplete).toBe(false)
    })

    it('should allow completing overdue tasks', () => {
      const taskSystem = useTaskSystem(mockCurrentTime)
      const addContentUnits = vi.fn()
      
      taskSystem.taskStartTime.value = baseTime
      mockCurrentTime.mockReturnValue(baseTime + 60000) // Double the duration
      
      const result = taskSystem.completeTask(addContentUnits)
      
      expect(result).toBe(true)
      expect(addContentUnits).toHaveBeenCalledWith(10)
    })
  })

  describe('Progress Reactivity', () => {
    it('should calculate different progress values based on current time', () => {
      // Test with different time functions to show the computed property works
      const time1Fn = vi.fn().mockReturnValue(baseTime)
      const time2Fn = vi.fn().mockReturnValue(baseTime + 15000)
      
      const taskSystem1 = useTaskSystem(time1Fn)
      const taskSystem2 = useTaskSystem(time2Fn)
      
      // Both start at the same time
      taskSystem1.taskStartTime.value = baseTime
      taskSystem2.taskStartTime.value = baseTime
      
      // Should have different progress based on current time
      expect(taskSystem1.taskProgress.value.progressPercent).toBe(0)
      expect(taskSystem2.taskProgress.value.progressPercent).toBe(50)
    })

    it('should update progress reactively when start time changes', () => {
      const taskSystem = useTaskSystem(mockCurrentTime)
      mockCurrentTime.mockReturnValue(baseTime + 15000)
      
      // Set start time to create 50% progress
      taskSystem.taskStartTime.value = baseTime
      expect(taskSystem.taskProgress.value.progressPercent).toBe(50)
      
      // Reset start time to current time
      taskSystem.taskStartTime.value = baseTime + 15000
      expect(taskSystem.taskProgress.value.progressPercent).toBe(0)
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle rapid completion cycles', () => {
      const taskSystem = useTaskSystem(mockCurrentTime)
      const addContentUnits = vi.fn()
      let currentTimeValue = baseTime
      
      mockCurrentTime.mockImplementation(() => currentTimeValue)
      taskSystem.taskStartTime.value = baseTime
      
      // Complete multiple tasks in sequence
      for (let i = 0; i < 3; i++) {
        currentTimeValue += 30000 // Advance by task duration
        const result = taskSystem.completeTask(addContentUnits)
        expect(result).toBe(true)
      }
      
      expect(addContentUnits).toHaveBeenCalledTimes(3)
      expect(taskSystem.taskStartTime.value).toBe(baseTime + 90000)
    })

    it('should handle task system with different time points', () => {
      // Test different time points by creating systems with different time functions
      const timeProgression = [0, 7500, 15000, 22500, 30000, 37500]
      const expectedProgress = [0, 25, 50, 75, 100, 100]
      const expectedComplete = [false, false, false, false, true, true]
      
      timeProgression.forEach((elapsed, index) => {
        const timeFn = vi.fn().mockReturnValue(baseTime + elapsed)
        const taskSystem = useTaskSystem(timeFn)
        taskSystem.taskStartTime.value = baseTime
        
        const progress = taskSystem.taskProgress.value
        
        expect(progress.progressPercent).toBe(expectedProgress[index])
        expect(progress.isComplete).toBe(expectedComplete[index])
      })
    })

    it('should maintain consistent state across multiple calls', () => {
      const taskSystem = useTaskSystem(mockCurrentTime)
      taskSystem.taskStartTime.value = baseTime
      mockCurrentTime.mockReturnValue(baseTime + 15000)
      
      // Multiple calls should return identical results
      const progress1 = taskSystem.taskProgress.value
      const progress2 = taskSystem.taskProgress.value
      const progress3 = taskSystem.taskProgress.value
      
      expect(progress1).toEqual(progress2)
      expect(progress2).toEqual(progress3)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long elapsed times', () => {
      const taskSystem = useTaskSystem(mockCurrentTime)
      
      taskSystem.taskStartTime.value = baseTime
      mockCurrentTime.mockReturnValue(baseTime + 300000) // 5 minutes elapsed
      
      const progress = taskSystem.taskProgress.value
      
      expect(progress.isComplete).toBe(true)
      expect(progress.progressPercent).toBe(100) // Should cap at 100
      expect(progress.timeRemaining).toBe(0)
    })

    it('should handle concurrent completion attempts', () => {
      const taskSystem = useTaskSystem(mockCurrentTime)
      const addContentUnits = vi.fn()
      
      taskSystem.taskStartTime.value = baseTime
      mockCurrentTime.mockReturnValue(baseTime + 30000)
      
      // Simulate concurrent completion attempts
      const result1 = taskSystem.completeTask(addContentUnits)
      const result2 = taskSystem.completeTask(addContentUnits)
      
      expect(result1).toBe(true)
      expect(result2).toBe(false) // Second call should fail since task was reset
      expect(addContentUnits).toHaveBeenCalledTimes(1)
    })

    it('should handle extreme start times', () => {
      const taskSystem = useTaskSystem(mockCurrentTime)
      
      // Set start time very far in the past
      taskSystem.taskStartTime.value = 1
      mockCurrentTime.mockReturnValue(baseTime)
      
      const progress = taskSystem.taskProgress.value
      
      expect(progress.isComplete).toBe(true)
      expect(progress.progressPercent).toBe(100)
      expect(progress.timeElapsed).toBeGreaterThan(30000)
    })

    it('should maintain correct constants', () => {
      const taskSystem = useTaskSystem(mockCurrentTime)
      
      expect(taskSystem.taskDuration).toBe(30000)
      expect(taskSystem.taskReward).toBe(10)
      expect(typeof taskSystem.taskDuration).toBe('number')
      expect(typeof taskSystem.taskReward).toBe('number')
    })
  })
})