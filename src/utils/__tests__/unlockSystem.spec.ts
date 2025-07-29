import { describe, it, expect, beforeEach } from 'vitest'
import { UnlockSystem, type UnlockCondition } from '../unlockSystem'
import type { GameState } from '../../stores/gameStore'

describe('UnlockSystem', () => {
  let mockGameState: GameState

  beforeEach(() => {
    mockGameState = {
      resources: {
        hcu: { current: 100, lifetime: 200 }
      },
      generators: [
        { id: 'basicAdBotFarm', name: 'Basic Ad-Bot Farm', owned: 3, baseProductionRate: 1, baseCost: 10, costGrowthRate: 1.15 },
        { id: 'clickbaitEngine', name: 'Clickbait Engine', owned: 1, baseProductionRate: 10, baseCost: 100, costGrowthRate: 1.2 }
      ],
      upgrades: [
        { id: 'testUpgrade', name: 'Test Upgrade', isPurchased: false, costs: [], unlockConditions: [], effects: [], description: '' }
      ],
      narratives: [
        { id: 'testNarrative', title: 'Test Story', isViewed: false, content: '', hasBeenTriggered: false }
      ],
      prestige: { level: 1 },
      gameStartTime: Date.now() - 5000,
      lastContentUnitsCheck: 90,
      hasTriggeredGameStart: true
    }
  })

  describe('Empty Conditions', () => {
    it('returns unlocked for empty conditions array', () => {
      const result = UnlockSystem.checkConditions([], mockGameState)
      
      expect(result.isUnlocked).toBe(true)
      expect(result.isVisible).toBe(true)
      expect(result.failedConditions).toHaveLength(0)
    })

    it('returns unlocked for null/undefined conditions', () => {
      const result = UnlockSystem.checkConditions(null as unknown as UnlockCondition[], mockGameState)
      
      expect(result.isUnlocked).toBe(true)
      expect(result.isVisible).toBe(true)
    })
  })

  describe('Resource Conditions', () => {
    it('passes when resource amount meets minimum requirement', () => {
      const conditions: UnlockCondition[] = [
        { type: 'resource', resourceId: 'hcu', minAmount: 50 }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(true)
      expect(result.failedConditions).toHaveLength(0)
    })

    it('fails when resource amount below minimum', () => {
      const conditions: UnlockCondition[] = [
        { type: 'resource', resourceId: 'hcu', minAmount: 150 }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
      expect(result.failedConditions).toContain('hcu (100) >= 150')
    })

    it('handles missing resource ID', () => {
      const conditions: UnlockCondition[] = [
        { type: 'resource', minAmount: 50 }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
      expect(result.failedConditions).toContain('Resource condition missing resourceId')
    })

    it('handles non-existent resource', () => {
      const conditions: UnlockCondition[] = [
        { type: 'resource', resourceId: 'nonexistent', minAmount: 50 }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
      expect(result.failedConditions).toContain('Resource not found: nonexistent')
    })

    it('supports different comparison operators', () => {
      const testCases = [
        { comparison: '>', minAmount: 50, expected: true },
        { comparison: '>', minAmount: 100, expected: false },
        { comparison: '<', minAmount: 150, expected: true },
        { comparison: '<', minAmount: 100, expected: false },
        { comparison: '==', minAmount: 100, expected: true },
        { comparison: '==', minAmount: 50, expected: false },
        { comparison: '!=', minAmount: 50, expected: true },
        { comparison: '!=', minAmount: 100, expected: false }
      ]

      testCases.forEach(({ comparison, minAmount, expected }) => {
        const conditions: UnlockCondition[] = [
          { type: 'resource', resourceId: 'hcu', minAmount, comparison: comparison as '>=' | '>' | '<' | '<=' | '==' | '!=' }
        ]
        
        const result = UnlockSystem.checkConditions(conditions, mockGameState)
        expect(result.isUnlocked).toBe(expected)
      })
    })

    it('handles max amount constraints', () => {
      const conditions: UnlockCondition[] = [
        { type: 'resource', resourceId: 'hcu', minAmount: 50, maxAmount: 150 }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      expect(result.isUnlocked).toBe(true)

      // Test failure when above max
      mockGameState.resources.hcu.current = 200
      const result2 = UnlockSystem.checkConditions(conditions, mockGameState)
      expect(result2.isUnlocked).toBe(false)
    })
  })

  describe('Generator Conditions', () => {
    it('passes when generator owned meets minimum', () => {
      const conditions: UnlockCondition[] = [
        { type: 'generator', generatorId: 'basicAdBotFarm', minOwned: 2 }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(true)
    })

    it('fails when generator owned below minimum', () => {
      const conditions: UnlockCondition[] = [
        { type: 'generator', generatorId: 'basicAdBotFarm', minOwned: 5 }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
      expect(result.failedConditions).toContain('Basic Ad-Bot Farm owned (3) >= 5')
    })

    it('handles missing generator ID', () => {
      const conditions: UnlockCondition[] = [
        { type: 'generator', minOwned: 5 }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
      expect(result.failedConditions).toContain('Generator condition missing generatorId')
    })

    it('handles non-existent generator', () => {
      const conditions: UnlockCondition[] = [
        { type: 'generator', generatorId: 'nonexistent', minOwned: 1 }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
      expect(result.failedConditions).toContain('Generator not found: nonexistent')
    })

    it('supports max owned constraints', () => {
      const conditions: UnlockCondition[] = [
        { type: 'generator', generatorId: 'basicAdBotFarm', minOwned: 1, maxOwned: 5 }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      expect(result.isUnlocked).toBe(true)

      // Test failure when above max
      mockGameState.generators[0].owned = 10
      const result2 = UnlockSystem.checkConditions(conditions, mockGameState)
      expect(result2.isUnlocked).toBe(false)
    })
  })

  describe('Upgrade Conditions', () => {
    it('passes when upgrade is purchased', () => {
      mockGameState.upgrades[0].isPurchased = true
      const conditions: UnlockCondition[] = [
        { type: 'upgrade', upgradeId: 'testUpgrade' }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(true)
    })

    it('fails when upgrade not purchased', () => {
      const conditions: UnlockCondition[] = [
        { type: 'upgrade', upgradeId: 'testUpgrade' }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
      expect(result.failedConditions).toContain('Upgrade not purchased: Test Upgrade')
    })

    it('handles missing upgrade ID', () => {
      const conditions: UnlockCondition[] = [
        { type: 'upgrade' }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
      expect(result.failedConditions).toContain('Upgrade condition missing upgradeId')
    })

    it('handles non-existent upgrade', () => {
      const conditions: UnlockCondition[] = [
        { type: 'upgrade', upgradeId: 'nonexistent' }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
      expect(result.failedConditions).toContain('Upgrade not found: nonexistent')
    })
  })

  describe('Narrative Conditions', () => {
    it('passes when narrative is viewed', () => {
      mockGameState.narratives[0].isViewed = true
      const conditions: UnlockCondition[] = [
        { type: 'narrative', narrativeId: 'testNarrative' }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(true)
    })

    it('fails when narrative not viewed', () => {
      const conditions: UnlockCondition[] = [
        { type: 'narrative', narrativeId: 'testNarrative' }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
      expect(result.failedConditions).toContain('Narrative not viewed: Test Story')
    })

    it('handles missing narrative ID', () => {
      const conditions: UnlockCondition[] = [
        { type: 'narrative' }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
      expect(result.failedConditions).toContain('Narrative condition missing narrativeId')
    })

    it('handles non-existent narrative', () => {
      const conditions: UnlockCondition[] = [
        { type: 'narrative', narrativeId: 'nonexistent' }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
      expect(result.failedConditions).toContain('Narrative not found: nonexistent')
    })
  })

  describe('Prestige Conditions', () => {
    it('passes when prestige level meets minimum', () => {
      const conditions: UnlockCondition[] = [
        { type: 'prestige', minPrestigeLevel: 1 }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(true)
    })

    it('fails when prestige level below minimum', () => {
      const conditions: UnlockCondition[] = [
        { type: 'prestige', minPrestigeLevel: 5 }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
      expect(result.failedConditions).toContain('Prestige level (1) >= 5')
    })

    it('handles missing prestige level', () => {
      const conditions: UnlockCondition[] = [
        { type: 'prestige' }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
      expect(result.failedConditions).toContain('Prestige condition missing minPrestigeLevel')
    })
  })

  describe('Time Conditions', () => {
    it('passes when play time meets minimum', () => {
      const conditions: UnlockCondition[] = [
        { type: 'time', minPlayTime: 3000 }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(true)
    })

    it('fails when play time below minimum', () => {
      const conditions: UnlockCondition[] = [
        { type: 'time', minPlayTime: 10000 }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
      expect(result.failedConditions[0]).toContain('Play time')
      expect(result.failedConditions[0]).toContain('>= 10s')
    })

    it('handles missing play time', () => {
      const conditions: UnlockCondition[] = [
        { type: 'time' }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
      expect(result.failedConditions).toContain('Time condition missing minPlayTime')
    })

    it('handles no game start time', () => {
      mockGameState.gameStartTime = undefined
      const conditions: UnlockCondition[] = [
        { type: 'time', minPlayTime: 1000 }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
    })
  })

  describe('Achievement Conditions', () => {
    it('returns not implemented for achievement conditions', () => {
      const conditions: UnlockCondition[] = [
        { type: 'achievement', achievementId: 'testAchievement' }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
      expect(result.failedConditions).toContain('Achievement system not implemented')
    })
  })

  describe('Multiple Conditions', () => {
    it('handles AND logic correctly - all pass', () => {
      const conditions: UnlockCondition[] = [
        {
          type: 'multiple',
          logic: 'AND',
          conditions: [
            { type: 'resource', resourceId: 'hcu', minAmount: 50 },
            { type: 'generator', generatorId: 'basicAdBotFarm', minOwned: 2 }
          ]
        }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(true)
    })

    it('handles AND logic correctly - one fails', () => {
      const conditions: UnlockCondition[] = [
        {
          type: 'multiple',
          logic: 'AND',
          conditions: [
            { type: 'resource', resourceId: 'hcu', minAmount: 50 },
            { type: 'generator', generatorId: 'basicAdBotFarm', minOwned: 10 }
          ]
        }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
      expect(result.failedConditions).toContain('Basic Ad-Bot Farm owned (3) >= 10')
    })

    it('handles OR logic correctly - one passes', () => {
      const conditions: UnlockCondition[] = [
        {
          type: 'multiple',
          logic: 'OR',
          conditions: [
            { type: 'resource', resourceId: 'hcu', minAmount: 200 },
            { type: 'generator', generatorId: 'basicAdBotFarm', minOwned: 2 }
          ]
        }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(true)
    })

    it('handles OR logic correctly - all fail', () => {
      const conditions: UnlockCondition[] = [
        {
          type: 'multiple',
          logic: 'OR',
          conditions: [
            { type: 'resource', resourceId: 'hcu', minAmount: 200 },
            { type: 'generator', generatorId: 'basicAdBotFarm', minOwned: 10 }
          ]
        }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
      expect(result.failedConditions).toHaveLength(2)
    })

    it('defaults to AND logic when not specified', () => {
      const conditions: UnlockCondition[] = [
        {
          type: 'multiple',
          conditions: [
            { type: 'resource', resourceId: 'hcu', minAmount: 50 },
            { type: 'generator', generatorId: 'basicAdBotFarm', minOwned: 10 }
          ]
        }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
    })

    it('handles empty multiple conditions', () => {
      const conditions: UnlockCondition[] = [
        {
          type: 'multiple',
          conditions: []
        }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(true)
    })
  })

  describe('Visibility Control', () => {
    it('respects visible flag when true', () => {
      const conditions: UnlockCondition[] = [
        { type: 'resource', resourceId: 'hcu', minAmount: 200, visible: true }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isVisible).toBe(true)
    })

    it('respects visible flag when false', () => {
      const conditions: UnlockCondition[] = [
        { type: 'resource', resourceId: 'hcu', minAmount: 200, visible: false }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isVisible).toBe(false)
    })

    it('defaults visible to true when not specified', () => {
      const conditions: UnlockCondition[] = [
        { type: 'resource', resourceId: 'hcu', minAmount: 200 }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isVisible).toBe(true)
    })
  })

  describe('Unknown Condition Types', () => {
    it('handles unknown condition types', () => {
      const conditions: UnlockCondition[] = [
        { type: 'unknown' as 'resource' } // Cast to valid type to test error handling
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(false)
      expect(result.failedConditions).toContain('Unknown condition type: unknown')
    })
  })

  describe('Complex Scenarios', () => {
    it('handles nested multiple conditions', () => {
      const conditions: UnlockCondition[] = [
        {
          type: 'multiple',
          logic: 'OR',
          conditions: [
            {
              type: 'multiple',
              logic: 'AND',
              conditions: [
                { type: 'resource', resourceId: 'hcu', minAmount: 50 },
                { type: 'generator', generatorId: 'basicAdBotFarm', minOwned: 2 }
              ]
            },
            { type: 'prestige', minPrestigeLevel: 5 }
          ]
        }
      ]
      
      const result = UnlockSystem.checkConditions(conditions, mockGameState)
      
      expect(result.isUnlocked).toBe(true)
    })
  })
})