import { ref } from 'vue'

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
  const tickRate = 100 // 100ms tick rate for smooth animations

  /**
   * Start the main game loop
   * @param callbacks - Object containing game functions to call during the loop
   */
  function startGameLoop(callbacks: {
    addContentUnits: (amount: number) => void
    completeTask: () => boolean
    triggerNarrative: (type: string, value?: number) => void
    getProductionRate: () => number
    getTaskProgress: () => { isComplete: boolean }
    getContentUnits: () => number
    getLastContentUnitsCheck: () => number
    setLastContentUnitsCheck: (value: number) => void
    getGameStartTime: () => number
    hasTriggeredGameStart: () => boolean
    setHasTriggeredGameStart: (value: boolean) => void
  }) {
    if (gameLoop !== null) return

    isRunning.value = true

    gameLoop = setInterval(() => {
      // Update reactive current time
      currentTime.value = Date.now()

      // Calculate passive income from generators (production rate is auto-computed)
      const productionRate = callbacks.getProductionRate()
      if (productionRate > 0) {
        const productionThisTick = (productionRate * tickRate) / 1000
        callbacks.addContentUnits(productionThisTick)
      }

      // Check for task completion and auto-complete
      const taskProgress = callbacks.getTaskProgress()
      if (taskProgress.isComplete) {
        callbacks.completeTask()
      }

      // Check narrative triggers based on content units
      const contentUnits = callbacks.getContentUnits()
      const lastContentUnitsCheck = callbacks.getLastContentUnitsCheck()
      if (Math.floor(contentUnits) > Math.floor(lastContentUnitsCheck)) {
        callbacks.triggerNarrative('contentUnits', contentUnits)
        callbacks.setLastContentUnitsCheck(contentUnits)
      }

      // Check time elapsed triggers
      const gameStartTime = callbacks.getGameStartTime()
      const timeElapsed = currentTime.value - gameStartTime
      callbacks.triggerNarrative('timeElapsed', timeElapsed)
    }, tickRate)

    // Trigger game start narrative (only once)
    if (!callbacks.hasTriggeredGameStart()) {
      callbacks.triggerNarrative('gameStart')
      callbacks.setHasTriggeredGameStart(true)
    }
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
