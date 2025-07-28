/**
 * Shared game loop tick logic to prevent duplication
 */
export interface GameTickCallbacks {
  addResource: (resourceId: string, amount: number) => void
  completeTask: () => boolean
  triggerNarrative: (type: string, value?: number, context?: string) => void
  getTaskProgress: () => { isComplete: boolean }
  getResourceAmount: (resourceId: string) => number
  getLastContentUnitsCheck: () => number
  setLastContentUnitsCheck: (value: number) => void
  getGameStartTime: () => number
  getCurrentTime: () => number
  applyResourceDecay?: () => void
  applyResourceProduction?: () => void
}

/**
 * Execute a single game tick with the provided callbacks
 */
export function executeGameTick(callbacks: GameTickCallbacks): void {
  // Apply multi-resource production from generators
  if (callbacks.applyResourceProduction) {
    callbacks.applyResourceProduction()
  }

  // Check for task completion and auto-complete
  const taskProgress = callbacks.getTaskProgress()
  if (taskProgress.isComplete) {
    callbacks.completeTask()
  }

  // Check narrative triggers based on HCU resource amount
  const contentUnits = callbacks.getResourceAmount('hcu')
  const lastContentUnitsCheck = callbacks.getLastContentUnitsCheck()
  if (Math.floor(contentUnits) > Math.floor(lastContentUnitsCheck)) {
    callbacks.triggerNarrative('resourceAmount', contentUnits, 'hcu')
    callbacks.setLastContentUnitsCheck(contentUnits)
  }

  // Check time elapsed triggers
  const gameStartTime = callbacks.getGameStartTime()
  const timeElapsed = callbacks.getCurrentTime() - gameStartTime
  callbacks.triggerNarrative('timeElapsed', timeElapsed)

  // Apply resource decay for depletable resources
  if (callbacks.applyResourceDecay) {
    callbacks.applyResourceDecay()
  }
}
