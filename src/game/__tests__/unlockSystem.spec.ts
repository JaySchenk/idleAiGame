import { describe, it, expect, beforeEach } from 'vitest'
import { UnlockSystem, type UnlockCondition } from '../unlockSystem'
import type { GameState } from '../../stores/gameStore'

describe('UnlockSystem', () => {
  let mockGameState: GameState

  beforeEach(() => {
    mockGameState = {
      resources: {
        hcu: { current: 100, lifetime: 500 },
        autonomy: { current: 50, lifetime: 50 },
      },
      generators: [
        { id: 'farm', name: 'Ad Farm', owned: 5 },
        { id: 'network', name: 'Bot Network', owned: 0 },
      ],
      upgrades: [
        { id: 'automation', name: 'Soul-Crushing Automation', isPurchased: true },
        { id: 'efficiency', name: 'Efficiency Boost', isPurchased: false },
      ],
      narratives: [
        { id: 'welcome', title: 'Welcome', isViewed: true },
        { id: 'first-generator', title: 'First Generator', isViewed: false },
      ],
      prestige: { level: 2 },
      gameStartTime: Date.now() - 120000, // 2 minutes ago
    } as GameState
  })

  describe('checkConditions', () => {
    it('should return unlocked for empty conditions', () => {
      const result = UnlockSystem.checkConditions([], mockGameState)
      expect(result).toEqual({
        isUnlocked: true,
        isVisible: true,
        failedConditions: [],
      })
    })

    it('should handle null/undefined conditions', () => {
      const result = UnlockSystem.checkConditions(
        null as unknown as UnlockCondition[],
        mockGameState,
      )
      expect(result.isUnlocked).toBe(true)
      expect(result.isVisible).toBe(true)
    })

    describe('resource conditions', () => {
      it('should unlock when resource amount meets minimum', () => {
        const condition: UnlockCondition = {
          type: 'resource',
          resourceId: 'hcu',
          minAmount: 50,
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isUnlocked).toBe(true)
        expect(result.failedConditions).toEqual([])
      })

      it('should not unlock when resource amount is below minimum', () => {
        const condition: UnlockCondition = {
          type: 'resource',
          resourceId: 'hcu',
          minAmount: 200,
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isUnlocked).toBe(false)
        expect(result.failedConditions).toHaveLength(1)
      })

      it('should handle different comparison operators', () => {
        const testCases = [
          { comparison: '>', minAmount: 50, expected: true },
          { comparison: '>', minAmount: 100, expected: false },
          { comparison: '<', minAmount: 150, expected: true },
          { comparison: '<', minAmount: 100, expected: false },
          { comparison: '==', minAmount: 100, expected: true },
          { comparison: '==', minAmount: 50, expected: false },
          { comparison: '!=', minAmount: 50, expected: true },
          { comparison: '!=', minAmount: 100, expected: false },
        ]

        testCases.forEach(({ comparison, minAmount, expected }) => {
          const condition: UnlockCondition = {
            type: 'resource',
            resourceId: 'hcu',
            minAmount,
            comparison: comparison as '>=' | '>' | '<' | '<=' | '==' | '!=',
          }

          const result = UnlockSystem.checkConditions([condition], mockGameState)
          expect(result.isUnlocked).toBe(expected)
        })
      })

      it('should fail for missing resource', () => {
        const condition: UnlockCondition = {
          type: 'resource',
          resourceId: 'nonexistent',
          minAmount: 50,
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isUnlocked).toBe(false)
        expect(result.failedConditions[0]).toContain('Resource not found')
      })
    })

    describe('generator conditions', () => {
      it('should unlock when generator owned meets minimum', () => {
        const condition: UnlockCondition = {
          type: 'generator',
          generatorId: 'farm',
          minOwned: 3,
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isUnlocked).toBe(true)
      })

      it('should not unlock when generator owned is below minimum', () => {
        const condition: UnlockCondition = {
          type: 'generator',
          generatorId: 'network',
          minOwned: 1,
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isUnlocked).toBe(false)
      })
    })

    describe('upgrade conditions', () => {
      it('should unlock when upgrade is purchased', () => {
        const condition: UnlockCondition = {
          type: 'upgrade',
          upgradeId: 'automation',
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isUnlocked).toBe(true)
      })

      it('should not unlock when upgrade is not purchased', () => {
        const condition: UnlockCondition = {
          type: 'upgrade',
          upgradeId: 'efficiency',
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isUnlocked).toBe(false)
      })
    })

    describe('not_upgrade conditions', () => {
      it('should unlock when upgrade is NOT purchased', () => {
        const condition: UnlockCondition = {
          type: 'not_upgrade',
          upgradeId: 'efficiency',
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isUnlocked).toBe(true)
      })

      it('should not unlock when upgrade IS purchased', () => {
        const condition: UnlockCondition = {
          type: 'not_upgrade',
          upgradeId: 'automation',
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isUnlocked).toBe(false)
      })
    })

    describe('narrative conditions', () => {
      it('should unlock when narrative is viewed', () => {
        const condition: UnlockCondition = {
          type: 'narrative',
          narrativeId: 'welcome',
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isUnlocked).toBe(true)
      })

      it('should not unlock when narrative is not viewed', () => {
        const condition: UnlockCondition = {
          type: 'narrative',
          narrativeId: 'first-generator',
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isUnlocked).toBe(false)
      })
    })

    describe('prestige conditions', () => {
      it('should unlock when prestige level meets minimum', () => {
        const condition: UnlockCondition = {
          type: 'prestige',
          minPrestigeLevel: 1,
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isUnlocked).toBe(true)
      })

      it('should not unlock when prestige level is below minimum', () => {
        const condition: UnlockCondition = {
          type: 'prestige',
          minPrestigeLevel: 5,
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isUnlocked).toBe(false)
      })
    })

    describe('time conditions', () => {
      it('should unlock when play time meets minimum', () => {
        const condition: UnlockCondition = {
          type: 'time',
          minPlayTime: 60000, // 1 minute
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isUnlocked).toBe(true)
      })

      it('should not unlock when play time is below minimum', () => {
        const condition: UnlockCondition = {
          type: 'time',
          minPlayTime: 300000, // 5 minutes
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isUnlocked).toBe(false)
      })
    })

    describe('multiple conditions', () => {
      it('should unlock when all AND conditions are met', () => {
        const condition: UnlockCondition = {
          type: 'multiple',
          logic: 'AND',
          conditions: [
            { type: 'resource', resourceId: 'hcu', minAmount: 50 },
            { type: 'generator', generatorId: 'farm', minOwned: 3 },
          ],
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isUnlocked).toBe(true)
      })

      it('should not unlock when not all AND conditions are met', () => {
        const condition: UnlockCondition = {
          type: 'multiple',
          logic: 'AND',
          conditions: [
            { type: 'resource', resourceId: 'hcu', minAmount: 50 },
            { type: 'generator', generatorId: 'network', minOwned: 1 },
          ],
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isUnlocked).toBe(false)
      })

      it('should unlock when any OR condition is met', () => {
        const condition: UnlockCondition = {
          type: 'multiple',
          logic: 'OR',
          conditions: [
            { type: 'resource', resourceId: 'hcu', minAmount: 200 }, // false
            { type: 'generator', generatorId: 'farm', minOwned: 3 }, // true
          ],
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isUnlocked).toBe(true)
      })

      it('should default to AND logic when not specified', () => {
        const condition: UnlockCondition = {
          type: 'multiple',
          conditions: [
            { type: 'resource', resourceId: 'hcu', minAmount: 50 },
            { type: 'generator', generatorId: 'farm', minOwned: 3 },
          ],
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isUnlocked).toBe(true)
      })
    })

    describe('visibility control', () => {
      it('should be visible by default', () => {
        const condition: UnlockCondition = {
          type: 'resource',
          resourceId: 'hcu',
          minAmount: 200,
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isVisible).toBe(true)
      })

      it('should respect visible: false', () => {
        const condition: UnlockCondition = {
          type: 'resource',
          resourceId: 'hcu',
          minAmount: 200,
          visible: false,
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isVisible).toBe(false)
      })
    })

    describe('achievement conditions', () => {
      it('should return not implemented for achievement conditions', () => {
        const condition: UnlockCondition = {
          type: 'achievement',
          achievementId: 'first-click',
        }

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isUnlocked).toBe(false)
        expect(result.failedConditions[0]).toContain('Achievement system not implemented')
      })
    })

    describe('unknown condition types', () => {
      it('should handle unknown condition types gracefully', () => {
        const condition = {
          type: 'unknown',
        } as UnlockCondition

        const result = UnlockSystem.checkConditions([condition], mockGameState)
        expect(result.isUnlocked).toBe(false)
        expect(result.failedConditions[0]).toContain('Unknown condition type')
      })
    })
  })
})
