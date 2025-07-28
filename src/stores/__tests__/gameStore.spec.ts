import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGameStore } from '../gameStore'
import { createTestPinia } from '../../test-utils'
import {
  mathTestCases,
  testScenarios,
  mockGenerators,
  mockUpgrades,
} from '../../test-utils/fixtures'
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

      expect(store.getCurrencyAmount('hcu')).toBe(0)
      expect(store.lifetimeCurrencyAmounts['hcu']).toBe(0)
      expect(store.prestigeLevel).toBe(0)
      expect(store.generators).toHaveLength(2)
      expect(store.upgrades).toHaveLength(2)
    })

    it('should add content units correctly', () => {
      const store = useGameStore()

      store.addCurrency('hcu', 100)

      expect(store.getCurrencyAmount('hcu')).toBe(100)
      expect(store.lifetimeCurrencyAmounts['hcu']).toBe(100)
    })

    it('should spend content units when available', () => {
      const store = useGameStore()
      store.addCurrency('hcu', 100)

      const result = ((amount: number) => store.spendCurrency('hcu', amount))(50)

      expect(result).toBe(true)
      expect(store.getCurrencyAmount('hcu')).toBe(50)
      expect(store.lifetimeCurrencyAmounts['hcu']).toBe(100) // Lifetime should not decrease
    })

    it('should not spend content units when insufficient', () => {
      const store = useGameStore()
      store.addCurrency('hcu', 30)

      const result = ((amount: number) => store.spendCurrency('hcu', amount))(50)

      expect(result).toBe(false)
      expect(store.getCurrencyAmount('hcu')).toBe(30)
    })

    it('should check affordability correctly', () => {
      const store = useGameStore()
      store.addCurrency('hcu', 100)

      expect(((amount: number) => store.canAffordCurrency('hcu', amount))(50)).toBe(true)
      expect(((amount: number) => store.canAffordCurrency('hcu', amount))(100)).toBe(true)
      expect(((amount: number) => store.canAffordCurrency('hcu', amount))(150)).toBe(false)
    })
  })

  describe('Mathematical Calculations', () => {
    describe('Generator Cost Calculations', () => {
      it('should calculate generator costs correctly', () => {
        const store = useGameStore()

        mathTestCases.generatorCosts.forEach(({ baseCost, growthRate, owned, expected }) => {
          // Set up generator with specific owned count
          const generator = store.generators.find(
            (g) => g.baseCost === baseCost && g.growthRate === growthRate,
          )
          if (generator) {
            generator.owned = owned
            const cost = store.getGeneratorCost(generator.id)
            expect(cost).toBe(expected)
          }
        })
      })

      it('should return 0 for non-existent generator', () => {
        const store = useGameStore()

        // Test non-existent generator by creating a mock object
        const mockGenerator = {
          id: 'nonexistent',
          name: 'Test',
          baseCost: 0,
          growthRate: 1,
          baseProduction: 0,
          owned: 0,
        }
        const cost = store.getGeneratorCost('nonexistent')

        expect(cost).toBe(0)
      })
    })

    describe('Production Rate Calculations', () => {
      it('should calculate base production rates correctly', () => {
        const store = useGameStore()
        const generator = store.generators[0]

        generator.owned = 5

        const rate = store.getGeneratorProductionRate(generator.id)

        expect(rate).toBe(5) // baseProduction (1) * owned (5) * multiplier (1)
      })

      it('should apply generator-specific multipliers', () => {
        const store = useGameStore()
        const generator = store.generators[0]
        const upgrade = store.upgrades[0]

        generator.owned = 4
        upgrade.isPurchased = true

        const rate = store.getGeneratorProductionRate(generator.id)

        expect(rate).toBe(5) // baseProduction (1) * owned (4) * multiplier (1.25)
      })

      it('should calculate total production rate with all multipliers', () => {
        const store = useGameStore()

        // Set up generators
        store.generators[0].owned = 5
        store.generators[1].owned = 2

        // Set up upgrades
        store.upgrades[0].isPurchased = true // Generator-specific multiplier (1.25x)

        const totalRate = store.productionRate

        // Generator 1: 1 * 5 * 1.25 = 6.25
        // Generator 2: 10 * 2 * 1 = 20
        // Total: 26.25 * globalMultiplier (1) = 26.25
        expect(totalRate).toBe(26.25)
      })

      it('should apply prestige multiplier to production', () => {
        const store = useGameStore()

        store.generators[0].owned = 10
        store.prestigeLevel = 1

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
          store.prestigeLevel = level
          expect(store.globalMultiplier).toBeCloseTo(expectedMultiplier, 6)
        })
      })

      it('should calculate prestige thresholds correctly', () => {
        const store = useGameStore()

        mathTestCases.prestigeCalculations.forEach(({ level, expectedThreshold }) => {
          store.prestigeLevel = level
          expect(store.prestigeThreshold).toBe(expectedThreshold)
        })
      })

      it('should determine prestige eligibility correctly', () => {
        const store = useGameStore()

        store.currencyAmounts['hcu'] = 999
        expect(store.canPrestige).toBe(false)

        store.currencyAmounts['hcu'] = 1000
        expect(store.canPrestige).toBe(true)

        store.currencyAmounts['hcu'] = 1001
        expect(store.canPrestige).toBe(true)
      })

      it('should calculate next prestige multiplier', () => {
        const store = useGameStore()

        store.prestigeLevel = 0
        expect(store.nextPrestigeMultiplier).toBe(1.25)

        store.prestigeLevel = 1
        expect(store.nextPrestigeMultiplier).toBe(1.5625)
      })
    })

    describe('Click Value Calculations', () => {
      it('should calculate click value with prestige multiplier', () => {
        const store = useGameStore()

        expect(store.clickValue).toBe(1)

        store.prestigeLevel = 1
        expect(store.clickValue).toBe(1.25)

        store.prestigeLevel = 2
        expect(store.clickValue).toBeCloseTo(1.5625, 6)
      })
    })
  })

  describe('Currency Formatting', () => {
    it('should format currency correctly for all ranges', () => {
      const store = useGameStore()

      mathTestCases.currencyFormatting.forEach(({ input, expected }) => {
        const formatted = ((amount: number) => store.formatCurrency('hcu', amount))(input)
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

      store.addCurrency('hcu', 5)
      expect(store.canPurchaseGenerator(generator)).toBe(false)

      store.addCurrency('hcu', 5)
      expect(store.canPurchaseGenerator(generator)).toBe(true)
    })

    it('should purchase generator successfully', () => {
      const store = useGameStore()
      const generator = 'basicAdBotFarm'

      store.addCurrency('hcu', 20)

      const result = store.purchaseGenerator(generator)
      const storeGenerator = store.getGenerator(generator)

      expect(result).toBe(true)
      expect(storeGenerator?.owned).toBe(1)
      expect(store.getCurrencyAmount('hcu')).toBe(10) // 20 - 10 cost
    })

    it('should not purchase generator when insufficient funds', () => {
      const store = useGameStore()
      const generator = 'basicAdBotFarm'

      store.addCurrency('hcu', 5)

      const result = store.purchaseGenerator(generator)
      const storeGenerator = store.getGenerator(generator)

      expect(result).toBe(false)
      expect(storeGenerator?.owned).toBe(0)
      expect(store.getCurrencyAmount('hcu')).toBe(5)
    })

    it('should calculate increasing costs for multiple purchases', () => {
      const store = useGameStore()
      const generatorConfig = 'basicAdBotFarm'
      const generator = store.getGenerator(generatorConfig)!

      // First purchase: cost should be 10
      expect(store.getGeneratorCost(generatorConfig)).toBe(10)

      generator.owned = 1
      // Second purchase: cost should be 11 (10 * 1.15^1)
      expect(store.getGeneratorCost(generatorConfig)).toBe(11)

      generator.owned = 5
      // Sixth purchase: cost should be 20 (10 * 1.15^5)
      expect(store.getGeneratorCost(generatorConfig)).toBe(20)
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
      store.addCurrency('hcu', 100)
      expect(store.canPurchaseUpgrade(upgrade)).toBe(false)

      // Enough generators, not enough money
      generator.owned = 5
      store.currencyAmounts['hcu'] = 30
      expect(store.canPurchaseUpgrade(upgrade)).toBe(false)

      // Both requirements met
      generator.owned = 5
      store.currencyAmounts['hcu'] = 100
      expect(store.canPurchaseUpgrade(upgrade)).toBe(true)
    })

    it('should purchase upgrade successfully', () => {
      const store = useGameStore()
      const upgrade = 'automatedContentScript'
      const generator = store.getGenerator('basicAdBotFarm')!

      generator.owned = 5
      store.addCurrency('hcu', 100)

      const result = store.purchaseUpgrade(upgrade)
      const storeUpgrade = store.getUpgrade(upgrade)!

      expect(result).toBe(true)
      expect(storeUpgrade.isPurchased).toBe(true)
      expect(store.getCurrencyAmount('hcu')).toBe(50) // 100 - 50 cost
    })

    it('should not purchase already purchased upgrade', () => {
      const store = useGameStore()
      const upgradeConfig = 'automatedContentScript'
      const generator = store.getGenerator('basicAdBotFarm')!
      const upgrade = store.getUpgrade(upgradeConfig)!

      generator.owned = 5
      upgrade.isPurchased = true
      store.addCurrency('hcu', 100)

      const result = store.purchaseUpgrade(upgradeConfig)

      expect(result).toBe(false)
      expect(store.getCurrencyAmount('hcu')).toBe(100) // No money spent
    })
  })

  describe('Player Actions', () => {
    it('should handle manual clicks correctly', () => {
      const store = useGameStore()

      store.clickForContent()

      expect(store.getCurrencyAmount('hcu')).toBe(1)
      expect(store.lifetimeCurrencyAmounts['hcu']).toBe(1)
    })

    it('should apply prestige multiplier to clicks', () => {
      const store = useGameStore()

      store.prestigeLevel = 1
      store.clickForContent()

      expect(store.getCurrencyAmount('hcu')).toBe(1.25)
      expect(store.lifetimeCurrencyAmounts['hcu']).toBe(1.25)
    })
  })

  describe('Prestige System', () => {
    it('should perform prestige successfully when eligible', () => {
      const store = useGameStore()

      // Set up for prestige
      store.addCurrency('hcu', 1000)
      store.generators[0].owned = 10
      store.upgrades[0].isPurchased = true

      const result = store.performPrestige()

      expect(result).toBe(true)
      expect(store.prestigeLevel).toBe(1)
      expect(store.getCurrencyAmount('hcu')).toBe(0)
      expect(store.generators[0].owned).toBe(0)
      expect(store.upgrades[0].isPurchased).toBe(false)
      expect(store.lifetimeCurrencyAmounts['hcu']).toBe(1000) // Should not reset
    })

    it('should not perform prestige when not eligible', () => {
      const store = useGameStore()

      store.addCurrency('hcu', 500) // Not enough for prestige

      const result = store.performPrestige()

      expect(result).toBe(false)
      expect(store.prestigeLevel).toBe(0)
      expect(store.getCurrencyAmount('hcu')).toBe(500)
    })

    it('should reset generators correctly', () => {
      const store = useGameStore()

      store.generators[0].owned = 10
      store.generators[1].owned = 5

      store.resetGenerators()

      expect(store.generators[0].owned).toBe(0)
      expect(store.generators[1].owned).toBe(0)
    })

    it('should reset upgrades correctly', () => {
      const store = useGameStore()

      store.upgrades[0].isPurchased = true
      store.upgrades[1].isPurchased = true

      store.resetUpgrades()

      expect(store.upgrades[0].isPurchased).toBe(false)
      expect(store.upgrades[1].isPurchased).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large numbers correctly', () => {
      const store = useGameStore()

      const largeNumber = 1e15
      store.addCurrency('hcu', largeNumber)

      expect(store.getCurrencyAmount('hcu')).toBe(largeNumber)
      expect(store.lifetimeCurrencyAmounts['hcu']).toBe(largeNumber)

      const formatted = ((amount: number) => store.formatCurrency('hcu', amount))(largeNumber)
      expect(formatted).toBe('1.00Q HCU')
    })

    it('should handle zero and negative numbers safely', () => {
      const store = useGameStore()

      expect(((amount: number) => store.canAffordCurrency('hcu', amount))(0)).toBe(true)
      expect(((amount: number) => store.canAffordCurrency('hcu', amount))(-1)).toBe(true) // Edge case
      expect(((amount: number) => store.spendCurrency('hcu', amount))(0)).toBe(true)
    })

    it('should handle decimal precision correctly', () => {
      const store = useGameStore()

      store.addCurrency('hcu', 0.1)
      store.addCurrency('hcu', 0.2)

      // Should handle floating point precision issues
      expect(store.getCurrencyAmount('hcu')).toBeCloseTo(0.3, 10)
    })

    it('should handle generator cost overflow gracefully', () => {
      const store = useGameStore()
      const generator = store.generators[0]

      // Set to a high owned count that might cause overflow
      generator.owned = 200

      const cost = store.getGeneratorCost(generator.id)

      // Cost should be finite and positive
      expect(cost).toBeGreaterThan(0)
      expect(Number.isFinite(cost)).toBe(true)
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
        requirements: [],
      }

      store.upgrades.push(upgradeWithNoReqs)

      expect(store.areUpgradeRequirementsMet(upgradeWithNoReqs.id)).toBe(true)
    })

    it('should handle maximum safe integer values', () => {
      const store = useGameStore()

      const maxSafeInt = Number.MAX_SAFE_INTEGER
      store.addCurrency('hcu', maxSafeInt)

      expect(store.getCurrencyAmount('hcu')).toBe(maxSafeInt)
      expect(((amount: number) => store.canAffordCurrency('hcu', amount))(maxSafeInt)).toBe(true)
      expect(((amount: number) => store.canAffordCurrency('hcu', amount))(maxSafeInt + 1)).toBe(
        false,
      )
    })

    it('should maintain consistent lifetime content units', () => {
      const store = useGameStore()

      store.addCurrency('hcu', 100)
      store.spendCurrency('hcu', 50)
      store.addCurrency('hcu', 25)

      expect(store.getCurrencyAmount('hcu')).toBe(75)
      expect(store.lifetimeCurrencyAmounts['hcu']).toBe(125) // Only additions count
    })
  })
})
