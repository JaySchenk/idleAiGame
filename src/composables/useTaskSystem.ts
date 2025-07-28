import { ref, computed } from 'vue'
import { GAME_CONSTANTS } from '../config/gameConstants'

/**
 * Task system composable that manages time-based tasks and rewards
 */
export function useTaskSystem(currentTime: () => number) {
  // Task system constants
  const taskDuration = GAME_CONSTANTS.TASK_DURATION
  const taskReward = GAME_CONSTANTS.TASK_REWARD

  // Task state
  const taskStartTime = ref(Date.now()) // Will be restored from persistence if available

  /**
   * Task progress computed property
   * Calculates progress based on elapsed time since task started
   */
  const taskProgress = computed(() => {
    const timeElapsed = currentTime() - taskStartTime.value
    const timeRemaining = Math.max(0, taskDuration - timeElapsed)
    const progressPercent = Math.min(100, (timeElapsed / taskDuration) * 100)
    const isComplete = timeElapsed >= taskDuration

    return {
      timeElapsed,
      timeRemaining,
      progressPercent,
      isComplete,
      rewardAmount: taskReward,
      duration: taskDuration,
    }
  })

  /**
   * Complete the current task and start a new one
   * @param addContentUnits - Function to add content units as reward
   * @returns true if task was completed, false if not ready
   */
  function completeTask(addContentUnits: (amount: number) => void): boolean {
    const progress = taskProgress.value
    if (!progress.isComplete) {
      return false
    }

    // Grant reward
    addContentUnits(taskReward)

    // Reset timer to start new task
    taskStartTime.value = currentTime()

    return true
  }

  return {
    // Constants
    taskDuration,
    taskReward,

    // State
    taskStartTime,

    // Computed
    taskProgress,

    // Actions
    completeTask,
  }
}
