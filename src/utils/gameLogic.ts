/**
 * Shared game loop tick logic to prevent duplication
 */
import type { GameState } from '../stores/gameStore'

export interface GameTickCallbacks {
  addResource: (resourceId: string, amount: number) => void
  completeTask: () => boolean
  checkAndTriggerNarratives: (gameState: GameState) => void
  getTaskProgress: () => { isComplete: boolean }
  getResourceAmount: (resourceId: string) => number
  getGameStartTime: () => number
  getCurrentTime: () => number
  applyResourceDecay?: () => void
  applyResourceProduction?: () => void
  getGameState: () => GameState
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

  // Check narrative triggers using unified system
  const gameState = callbacks.getGameState()
  callbacks.checkAndTriggerNarratives(gameState)

  // Apply resource decay for depletable resources
  if (callbacks.applyResourceDecay) {
    callbacks.applyResourceDecay()
  }
}
