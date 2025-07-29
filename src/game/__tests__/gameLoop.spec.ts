import { describe, it, expect, vi, beforeEach } from 'vitest'
import { executeGameTick, type GameTickCallbacks } from '../gameLoop'
import type { GameState } from '../../stores/gameStore'

describe('gameLoop', () => {
  let mockCallbacks: GameTickCallbacks
  let mockGameState: GameState

  beforeEach(() => {
    mockGameState = {
      resources: {},
      generators: [],
      upgrades: [],
      narratives: [],
      prestige: { level: 0 },
      gameStartTime: Date.now(),
    } as GameState

    mockCallbacks = {
      addResource: vi.fn(),
      completeTask: vi.fn().mockReturnValue(true),
      checkAndTriggerNarratives: vi.fn(),
      getTaskProgress: vi.fn().mockReturnValue({ isComplete: false }),
      getResourceAmount: vi.fn().mockReturnValue(100),
      getGameStartTime: vi.fn().mockReturnValue(Date.now()),
      getCurrentTime: vi.fn().mockReturnValue(Date.now()),
      applyResourceDecay: vi.fn(),
      applyResourceProduction: vi.fn(),
      getGameState: vi.fn().mockReturnValue(mockGameState),
    }
  })

  describe('executeGameTick', () => {
    it('should call applyResourceProduction if provided', () => {
      executeGameTick(mockCallbacks)
      expect(mockCallbacks.applyResourceProduction).toHaveBeenCalled()
    })

    it('should not fail if applyResourceProduction is not provided', () => {
      const callbacksWithoutProduction = { ...mockCallbacks, applyResourceProduction: undefined }
      expect(() => executeGameTick(callbacksWithoutProduction)).not.toThrow()
    })

    it('should check task progress and complete if ready', () => {
      mockCallbacks.getTaskProgress.mockReturnValue({ isComplete: true })

      executeGameTick(mockCallbacks)

      expect(mockCallbacks.getTaskProgress).toHaveBeenCalled()
      expect(mockCallbacks.completeTask).toHaveBeenCalled()
    })

    it('should not complete task if not ready', () => {
      mockCallbacks.getTaskProgress.mockReturnValue({ isComplete: false })

      executeGameTick(mockCallbacks)

      expect(mockCallbacks.getTaskProgress).toHaveBeenCalled()
      expect(mockCallbacks.completeTask).not.toHaveBeenCalled()
    })

    it('should check and trigger narratives', () => {
      executeGameTick(mockCallbacks)

      expect(mockCallbacks.getGameState).toHaveBeenCalled()
      expect(mockCallbacks.checkAndTriggerNarratives).toHaveBeenCalledWith(mockGameState)
    })

    it('should call applyResourceDecay if provided', () => {
      executeGameTick(mockCallbacks)
      expect(mockCallbacks.applyResourceDecay).toHaveBeenCalled()
    })

    it('should not fail if applyResourceDecay is not provided', () => {
      const callbacksWithoutDecay = { ...mockCallbacks, applyResourceDecay: undefined }
      expect(() => executeGameTick(callbacksWithoutDecay)).not.toThrow()
    })

    it('should execute all steps in correct order', () => {
      const calls: string[] = []

      mockCallbacks.applyResourceProduction = vi.fn(() => calls.push('production'))
      mockCallbacks.getTaskProgress = vi.fn(() => {
        calls.push('task-check')
        return { isComplete: true }
      })
      mockCallbacks.completeTask = vi.fn(() => {
        calls.push('task-complete')
        return true
      })
      mockCallbacks.getGameState = vi.fn(() => {
        calls.push('get-state')
        return mockGameState
      })
      mockCallbacks.checkAndTriggerNarratives = vi.fn(() => calls.push('narratives'))
      mockCallbacks.applyResourceDecay = vi.fn(() => calls.push('decay'))

      executeGameTick(mockCallbacks)

      expect(calls).toEqual([
        'production',
        'task-check',
        'task-complete',
        'get-state',
        'narratives',
        'decay',
      ])
    })
  })
})
