import { GAME_CONSTANTS } from '../config/gameConstants'

/**
 * Shared game loop tick logic to prevent duplication
 */
export interface GameTickCallbacks {
  addContentUnits: (amount: number) => void
  completeTask: () => boolean
  triggerNarrative: (type: string, value?: number) => void
  getProductionRate: () => number
  getTaskProgress: () => { isComplete: boolean }
  getContentUnits: () => number
  getLastContentUnitsCheck: () => number
  setLastContentUnitsCheck: (value: number) => void
  getGameStartTime: () => number
  getCurrentTime: () => number
}

/**
 * Execute a single game tick with the provided callbacks
 */
export function executeGameTick(callbacks: GameTickCallbacks): void {
  // Calculate passive income from generators
  const productionRate = callbacks.getProductionRate()
  if (productionRate > 0) {
    const productionThisTick = (productionRate * GAME_CONSTANTS.TICK_RATE) / 1000
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
  const timeElapsed = callbacks.getCurrentTime() - gameStartTime
  callbacks.triggerNarrative('timeElapsed', timeElapsed)
}
