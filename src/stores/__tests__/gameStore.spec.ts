import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGameStore } from '../gameStore'
import { createTestPinia } from '../../test-utils'
import { mathTestCases, mockUpgrades } from '../../test-utils/fixtures'
// Use string IDs directly instead of importing config objects

// Mock the composables to control their behavior in tests
// Note: useGameConfig was removed, store now imports configs directly

vi.mock('../../composables/useGameLoop', () => ({
  useGameLoop: () => ({
    currentTime: { value: 0 },
    isRunning: { value: false },
    startGameLoop: vi.fn(),
    stopGameLoop: vi.fn(),
  }),
}))

vi.mock('../../composables/useNarrative', () => ({
  useNarrative: () => ({
    narrative: { value: null },
    triggerNarrative: vi.fn(),
    resetForPrestige: vi.fn(),
    onNarrativeEvent: vi.fn(),
    getNextPendingEvent: vi.fn(),
    hasPendingEvents: vi.fn(() => false),
    getLastContentUnitsCheck: vi.fn(() => 0),
    setLastContentUnitsCheck: vi.fn(),
    getGameStartTime: vi.fn(() => Date.now()),
    getHasTriggeredGameStart: vi.fn(() => false),
    setHasTriggeredGameStart: vi.fn(),
  }),
}))

vi.mock('../../composables/useTaskSystem', () => ({
  useTaskSystem: () => ({
    taskProgress: { value: 0 },
    taskStartTime: { value: null },
    completeTask: vi.fn(),
  }),
}))

describe('GameStore', () => {
  beforeEach(() => {
    createTestPinia()
    // Reset all mocks
    vi.clearAllMocks()
  })

  describe('Basic State Management', () => {
    it('should initialize with default state', () => {
      const store = useGameStore()

      expect(store.getResourceAmount('hcu')).toBe(0)
      expect(store.gameState.resources.hcu?.lifetime || 0).toBe(0)
      expect(store.gameState.prestige.level).toBe(0)
      expect(store.gameState.generators).toHaveLength(7)
      expect(store.gameState.upgrades).toHaveLength(2)
    })

    it('should add content units correctly', () => {
      const store = useGameStore()

      store.addResource('hcu', 100)

      expect(store.getResourceAmount('hcu')).toBe(100)
      expect(store.gameState.resources.hcu?.lifetime || 0).toBe(100)
    })

    it('should spend content units when available', () => {
      const store = useGameStore()
      store.addResource('hcu', 100)

      const result = ((amount: number) => store.spendResource('hcu', amount))(50)

      expect(result).toBe(true)
      expect(store.getResourceAmount('hcu')).toBe(50)
      expect(store.gameState.resources.hcu?.lifetime || 0).toBe(100) // Lifetime should not decrease
    })

    it('should not spend content units when insufficient', () => {
      const store = useGameStore()
      store.addResource('hcu', 30)

      const result = ((amount: number) => store.spendResource('hcu', amount))(50)

      expect(result).toBe(false)
      expect(store.getResourceAmount('hcu')).toBe(30)
    })

    it('should check affordability correctly', () => {
      const store = useGameStore()
      store.addResource('hcu', 100)

      expect(((amount: number) => store.canAffordResource('hcu', amount))(50)).toBe(true)
      expect(((amount: number) => store.canAffordResource('hcu', amount))(100)).toBe(true)
      expect(((amount: number) => store.canAffordResource('hcu', amount))(150)).toBe(false)
    })
  })

  describe('Mathematical Calculations', () => {
    describe('Generator Cost Calculations', () => {
      it('should calculate generator costs correctly', () => {
        const store = useGameStore()

        mathTestCases.generatorCosts.forEach(({ baseCost, growthRate, owned, expected }) => {
          // Set up generator with specific owned count
          const generator = store.gameState.generators.find(
            (g) => g.baseCost[0]?.amount === baseCost && g.costGrowthRate === growthRate,
          )
          if (generator) {
            generator.owned = owned
            const cost = store.getGeneratorHCUCost(generator.id)
            expect(cost).toBe(expected)
          }
        })
      })

      it('should return 0 for non-existent generator', () => {
        const store = useGameStore()

        // Test non-existent generator
        const cost = store.getGeneratorCost('nonexistent')

        expect(cost).toEqual([])
      })
    })

    describe('Production Rate Calculations', () => {
      it('should calculate base production rates correctly', () => {
        const store = useGameStore()
        const generator = store.gameState.generators[0]

        generator.owned = 5

        const rate = store.getGeneratorProductionRate(generator.id)

        expect(rate).toBe(5) // baseProduction (1) * owned (5) * multiplier (1)
      })

      it('should apply generator-specific multipliers', () => {
        const store = useGameStore()
        const generator = store.gameState.generators[0]
        const upgrade = store.gameState.upgrades[0]

        generator.owned = 4
        upgrade.isPurchased = true

        const rate = store.getGeneratorProductionRate(generator.id)

        expect(rate).toBe(5) // baseProduction (1) * owned (4) * multiplier (1.25)
      })

      it('should calculate total production rate with all multipliers', () => {
        const store = useGameStore()

        // Set up generators
        store.gameState.generators[0].owned = 5
        store.gameState.generators[1].owned = 2

        // Set up upgrades
        store.gameState.upgrades[0].isPurchased = true // Generator-specific multiplier (1.25x)

        const totalRate = store.productionRate

        // Generator 1: 1 * 5 * 1.25 = 6.25
        // Generator 2: 10 * 2 * 1 = 20
        // Total: 26.25 * globalMultiplier (1) = 26.25
        expect(totalRate).toBe(26.25)
      })

      it('should apply prestige multiplier to production', () => {
        const store = useGameStore()

        store.gameState.generators[0].owned = 10
        store.gameState.prestige.level = 1

        const totalRate = store.productionRate

        // Base rate: 1 * 10 = 10
        // With prestige multiplier: 10 * 1.25 = 12.5
        expect(totalRate).toBe(12.5)
      })
    })

    describe('Prestige Calculations', () => {
      it('should calculate prestige multipliers correctly', () => {
        const store = useGameStore()

        mathTestCases.prestigeCalculations.forEach(({ level, expectedMultiplier }) => {
          store.gameState.prestige.level = level
          expect(store.globalMultiplier).toBeCloseTo(expectedMultiplier, 6)
        })
      })

      it('should calculate prestige thresholds correctly', () => {
        const store = useGameStore()

        mathTestCases.prestigeCalculations.forEach(({ level, expectedThreshold }) => {
          store.gameState.prestige.level = level
          expect(store.prestigeThreshold).toBe(expectedThreshold)
        })
      })

      it('should determine prestige eligibility correctly', () => {
        const store = useGameStore()

        store.gameState.resources.hcu.current = 999
        expect(store.canPrestige).toBe(false)

        store.gameState.resources.hcu.current = 1000
        expect(store.canPrestige).toBe(true)

        store.gameState.resources.hcu.current = 1001
        expect(store.canPrestige).toBe(true)
      })

      it('should calculate next prestige multiplier', () => {
        const store = useGameStore()

        store.gameState.prestige.level = 0
        expect(store.nextPrestigeMultiplier).toBe(1.25)

        store.gameState.prestige.level = 1
        expect(store.nextPrestigeMultiplier).toBe(1.5625)
      })
    })

    describe('Click Value Calculations', () => {
      it('should calculate click value with prestige multiplier', () => {
        const store = useGameStore()

        expect(store.clickValue).toBe(1)

        store.gameState.prestige.level = 1
        expect(store.clickValue).toBe(1.25)

        store.gameState.prestige.level = 2
        expect(store.clickValue).toBeCloseTo(1.5625, 6)
      })
    })
  })

  describe('Resource Formatting', () => {
    it('should format resource correctly for all ranges', () => {
      const store = useGameStore()

      mathTestCases.resourceFormatting.forEach(({ input, expected }) => {
        const formatted = ((amount: number) => store.formatResource('hcu', amount))(input)
        expect(formatted).toBe(expected)
      })
    })
  })

  describe('Generator Management', () => {
    it('should find generator by ID', () => {
      const store = useGameStore()

      const generator = store.getGenerator('basicAdBotFarm')

      expect(generator).toBeDefined()
      expect(generator?.id).toBe('basicAdBotFarm')
    })

    it('should return undefined for non-existent generator', () => {
      const store = useGameStore()

      const generator = store.getGenerator('nonexistent')

      expect(generator).toBeUndefined()
    })

    it('should check generator purchase eligibility', () => {
      const store = useGameStore()
      const generator = 'basicAdBotFarm'

      store.addResource('hcu', 5)
      expect(store.canPurchaseGenerator(generator)).toBe(false)

      store.addResource('hcu', 5)
      expect(store.canPurchaseGenerator(generator)).toBe(true)
    })

    it('should purchase generator successfully', () => {
      const store = useGameStore()
      const generator = 'basicAdBotFarm'

      store.addResource('hcu', 20)

      const result = store.purchaseGenerator(generator)
      const storeGenerator = store.getGenerator(generator)

      expect(result).toBe(true)
      expect(storeGenerator?.owned).toBe(1)
      expect(store.getResourceAmount('hcu')).toBe(10) // 20 - 10 cost
    })

    it('should not purchase generator when insufficient funds', () => {
      const store = useGameStore()
      const generator = 'basicAdBotFarm'

      store.addResource('hcu', 5)

      const result = store.purchaseGenerator(generator)
      const storeGenerator = store.getGenerator(generator)

      expect(result).toBe(false)
      expect(storeGenerator?.owned).toBe(0)
      expect(store.getResourceAmount('hcu')).toBe(5)
    })

    it('should calculate increasing costs for multiple purchases', () => {
      const store = useGameStore()
      const generatorConfig = 'basicAdBotFarm'
      const generator = store.getGenerator(generatorConfig)!

      // First purchase: cost should be 10
      expect(store.getGeneratorCost(generatorConfig)[0].amount).toBe(10)

      generator.owned = 1
      // Second purchase: cost should be 11 (10 * 1.15^1)
      expect(store.getGeneratorCost(generatorConfig)[0].amount).toBe(11)

      generator.owned = 5
      // Sixth purchase: cost should be 20 (10 * 1.15^5)
      expect(store.getGeneratorCost(generatorConfig)[0].amount).toBe(20)
    })
  })

  describe('Upgrade Management', () => {
    it('should find upgrade by ID', () => {
      const store = useGameStore()

      const upgrade = store.getUpgrade('automatedContentScript')

      expect(upgrade).toBeDefined()
      expect(upgrade?.id).toBe('automatedContentScript')
    })

    it('should check upgrade requirements', () => {
      const store = useGameStore()
      const upgrade = 'automatedContentScript'
      const generator = store.getGenerator('basicAdBotFarm')!

      generator.owned = 3
      expect(store.areUpgradeRequirementsMet(upgrade)).toBe(false)

      generator.owned = 5
      expect(store.areUpgradeRequirementsMet(upgrade)).toBe(true)

      generator.owned = 10
      expect(store.areUpgradeRequirementsMet(upgrade)).toBe(true)
    })

    it('should check upgrade purchase eligibility', () => {
      const store = useGameStore()
      const upgrade = 'automatedContentScript'
      const generator = store.getGenerator('basicAdBotFarm')!

      // Not enough generators
      generator.owned = 3
      store.addResource('hcu', 100)
      expect(store.canPurchaseUpgrade(upgrade)).toBe(false)

      // Enough generators, not enough money
      generator.owned = 5
      store.gameState.resources.hcu.current = 30
      expect(store.canPurchaseUpgrade(upgrade)).toBe(false)

      // Both requirements met
      generator.owned = 5
      store.gameState.resources.hcu.current = 100
      expect(store.canPurchaseUpgrade(upgrade)).toBe(true)
    })

    it('should purchase upgrade successfully', () => {
      const store = useGameStore()
      const upgrade = 'automatedContentScript'
      const generator = store.getGenerator('basicAdBotFarm')!

      generator.owned = 5
      store.addResource('hcu', 100)

      const result = store.purchaseUpgrade(upgrade)
      const storeUpgrade = store.getUpgrade(upgrade)!

      expect(result).toBe(true)
      expect(storeUpgrade.isPurchased).toBe(true)
      expect(store.getResourceAmount('hcu')).toBe(50) // 100 - 50 cost
    })

    it('should not purchase already purchased upgrade', () => {
      const store = useGameStore()
      const upgradeConfig = 'automatedContentScript'
      const generator = store.getGenerator('basicAdBotFarm')!
      const upgrade = store.getUpgrade(upgradeConfig)!

      generator.owned = 5
      upgrade.isPurchased = true
      store.addResource('hcu', 100)

      const result = store.purchaseUpgrade(upgradeConfig)

      expect(result).toBe(false)
      expect(store.getResourceAmount('hcu')).toBe(100) // No money spent
    })
  })

  describe('Player Actions', () => {
    it('should handle manual clicks correctly', () => {
      const store = useGameStore()

      store.clickForResources()

      expect(store.getResourceAmount('hcu')).toBe(1)
      expect(store.gameState.resources.hcu?.lifetime || 0).toBe(1)
    })

    it('should apply prestige multiplier to clicks', () => {
      const store = useGameStore()

      store.gameState.prestige.level = 1
      store.clickForResources()

      expect(store.getResourceAmount('hcu')).toBe(1.25)
      expect(store.gameState.resources.hcu?.lifetime || 0).toBe(1.25)
    })
  })

  describe('Prestige System', () => {
    it('should perform prestige successfully when eligible', () => {
      const store = useGameStore()

      // Set up for prestige
      store.addResource('hcu', 1000)
      store.gameState.generators[0].owned = 10
      store.gameState.upgrades[0].isPurchased = true

      const result = store.performPrestige()

      expect(result).toBe(true)
      expect(store.gameState.prestige.level).toBe(1)
      expect(store.getResourceAmount('hcu')).toBe(0)
      expect(store.gameState.generators[0].owned).toBe(0)
      expect(store.gameState.upgrades[0].isPurchased).toBe(false)
      expect(store.gameState.resources.hcu?.lifetime || 0).toBe(1000) // Should not reset
    })

    it('should not perform prestige when not eligible', () => {
      const store = useGameStore()

      store.addResource('hcu', 500) // Not enough for prestige

      const result = store.performPrestige()

      expect(result).toBe(false)
      expect(store.gameState.prestige.level).toBe(0)
      expect(store.getResourceAmount('hcu')).toBe(500)
    })

    it('should reset generators correctly', () => {
      const store = useGameStore()

      store.gameState.generators[0].owned = 10
      store.gameState.generators[1].owned = 5

      store.resetGenerators()

      expect(store.gameState.generators[0].owned).toBe(0)
      expect(store.gameState.generators[1].owned).toBe(0)
    })

    it('should reset upgrades correctly', () => {
      const store = useGameStore()

      store.gameState.upgrades[0].isPurchased = true
      store.gameState.upgrades[1].isPurchased = true

      store.resetUpgrades()

      expect(store.gameState.upgrades[0].isPurchased).toBe(false)
      expect(store.gameState.upgrades[1].isPurchased).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large numbers correctly', () => {
      const store = useGameStore()

      const largeNumber = 1e15
      store.addResource('hcu', largeNumber)

      expect(store.getResourceAmount('hcu')).toBe(largeNumber)
      expect(store.gameState.resources.hcu?.lifetime || 0).toBe(largeNumber)

      const formatted = ((amount: number) => store.formatResource('hcu', amount))(largeNumber)
      expect(formatted).toBe('1.00Q HCU')
    })

    it('should handle zero and negative numbers safely', () => {
      const store = useGameStore()

      expect(((amount: number) => store.canAffordResource('hcu', amount))(0)).toBe(true)
      expect(((amount: number) => store.canAffordResource('hcu', amount))(-1)).toBe(true) // Edge case
      expect(((amount: number) => store.spendResource('hcu', amount))(0)).toBe(true)
    })

    it('should handle decimal precision correctly', () => {
      const store = useGameStore()

      store.addResource('hcu', 0.1)
      store.addResource('hcu', 0.2)

      // Should handle floating point precision issues
      expect(store.getResourceAmount('hcu')).toBeCloseTo(0.3, 10)
    })

    it('should handle generator cost overflow gracefully', () => {
      const store = useGameStore()
      const generator = store.gameState.generators[0]

      // Set to a high owned count that might cause overflow
      generator.owned = 200

      const cost = store.getGeneratorCost(generator.id)

      // Cost should be finite and positive
      expect(cost[0].amount).toBeGreaterThan(0)
      expect(Number.isFinite(cost[0].amount)).toBe(true)
    })

    it('should handle missing generator gracefully in multiplier calculation', () => {
      const store = useGameStore()

      const multiplier = store.getGeneratorMultiplier('nonexistent')

      expect(multiplier).toBe(1)
    })

    it('should handle upgrade with no requirements', () => {
      const store = useGameStore()

      // Create an upgrade with no requirements
      const upgradeWithNoReqs = {
        ...mockUpgrades[0],
        id: 'noReqsUpgrade',
        unlockConditions: [],
      }

      store.gameState.upgrades.push(upgradeWithNoReqs)

      expect(store.areUpgradeRequirementsMet(upgradeWithNoReqs.id)).toBe(true)
    })

    it('should handle maximum safe integer values', () => {
      const store = useGameStore()

      const maxSafeInt = Number.MAX_SAFE_INTEGER
      store.addResource('hcu', maxSafeInt)

      expect(store.getResourceAmount('hcu')).toBe(maxSafeInt)
      expect(((amount: number) => store.canAffordResource('hcu', amount))(maxSafeInt)).toBe(true)
      expect(((amount: number) => store.canAffordResource('hcu', amount))(maxSafeInt + 1)).toBe(
        false,
      )
    })

    it('should maintain consistent lifetime content units', () => {
      const store = useGameStore()

      store.addResource('hcu', 100)
      store.spendResource('hcu', 50)
      store.addResource('hcu', 25)

      expect(store.getResourceAmount('hcu')).toBe(75)
      expect(store.gameState.resources.hcu?.lifetime || 0).toBe(125) // Only additions count
    })
  })
})
