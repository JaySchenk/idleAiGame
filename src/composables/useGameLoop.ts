import { ref } from 'vue'
import { GAME_CONSTANTS } from '../config/gameConstants'
import { executeGameTick, type GameTickCallbacks } from '../utils/gameLogic'

/**
 * Game loop composable that manages the main game tick cycle
 * Handles time updates, passive income, task completion, and narrative triggers
 */
export function useGameLoop() {
  // Game control state
  const isRunning = ref(false)
  const currentTime = ref(Date.now())

  // Game loop management
  let gameLoop: number | null = null
  const tickRate = GAME_CONSTANTS.TICK_RATE

  /**
   * Start the main game loop
   * @param callbacks - Object containing game functions to call during the loop
   */
  function startGameLoop(callbacks: GameTickCallbacks) {
    if (gameLoop !== null) return

    isRunning.value = true

    gameLoop = setInterval(() => {
      // Update reactive current time
      currentTime.value = Date.now()

      // Execute shared game tick logic
      executeGameTick({
        ...callbacks,
        getCurrentTime: () => currentTime.value,
      })
    }, tickRate)
  }

  /**
   * Stop the main game loop
   */
  function stopGameLoop() {
    if (gameLoop) {
      clearInterval(gameLoop)
      gameLoop = null
    }
    isRunning.value = false
  }

  return {
    // State
    isRunning,
    currentTime,

    // Constants
    tickRate,

    // Actions
    startGameLoop,
    stopGameLoop,
  }
}
