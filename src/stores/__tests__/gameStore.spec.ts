import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../gameStore'
import { createStandardTestPinia } from '../../test-utils/pinia'

describe('GameStore', () => {
  let store: ReturnType<typeof useGameStore>

  beforeEach(() => {
    // Create a fresh store for each test
    const pinia = createStandardTestPinia()
    store = useGameStore(pinia)
  })

  describe('Resource Management', () => {
    it('initializes with default resources', () => {
      expect(store.resourceSystem.getResourceAmount('hcu')).toBe(0)
      expect(store.gameState.resources.hcu.lifetime).toBe(0)
    })

    it('adds resources correctly', () => {
      store.resourceSystem.addResource('hcu', 100)

      expect(store.resourceSystem.getResourceAmount('hcu')).toBe(100)
      expect(store.gameState.resources.hcu.lifetime).toBe(100)
    })

    it('spends resources when available', () => {
      store.resourceSystem.addResource('hcu', 100)

      const result = store.resourceSystem.spendResource('hcu', 50)

      expect(result).toBe(true)
      expect(store.resourceSystem.getResourceAmount('hcu')).toBe(50)
      expect(store.gameState.resources.hcu.lifetime).toBe(100)
    })

    it('prevents spending more than available', () => {
      store.resourceSystem.addResource('hcu', 30)

      const result = store.resourceSystem.spendResource('hcu', 50)

      expect(result).toBe(false)
      expect(store.resourceSystem.getResourceAmount('hcu')).toBe(30)
    })

    it('checks affordability correctly', () => {
      store.resourceSystem.addResource('hcu', 100)

      expect(store.resourceSystem.canAffordResource('hcu', 50)).toBe(true)
      expect(store.resourceSystem.canAffordResource('hcu', 100)).toBe(true)
      expect(store.resourceSystem.canAffordResource('hcu', 150)).toBe(false)
    })
  })

  describe('Generator Management', () => {
    it('initializes generators from config', () => {
      expect(store.gameState.generators).toHaveLength(7)
      expect(store.gameState.generators[0].id).toBe('basicAdBotFarm')
      expect(store.gameState.generators[0].owned).toBe(0)
    })

    it('calculates generator costs with exponential growth', () => {
      const generator = store.generatorSystem.getGenerator('basicAdBotFarm')!

      // Base cost
      expect(store.generatorSystem.getGeneratorHCUCost('basicAdBotFarm')).toBe(10)

      // After purchasing
      generator.owned = 1
      expect(store.generatorSystem.getGeneratorHCUCost('basicAdBotFarm')).toBe(11)

      generator.owned = 5
      expect(store.generatorSystem.getGeneratorHCUCost('basicAdBotFarm')).toBe(20)
    })

    it('purchases generators when affordable', () => {
      store.resourceSystem.addResource('hcu', 20)

      const result = store.purchaseGenerator('basicAdBotFarm')

      expect(result).toBe(true)
      expect(store.generatorSystem.getGenerator('basicAdBotFarm')?.owned).toBe(1)
      expect(store.resourceSystem.getResourceAmount('hcu')).toBe(10)
    })

    it('prevents generator purchase when unaffordable', () => {
      store.resourceSystem.addResource('hcu', 5)

      const result = store.purchaseGenerator('basicAdBotFarm')

      expect(result).toBe(false)
      expect(store.generatorSystem.getGenerator('basicAdBotFarm')?.owned).toBe(0)
      expect(store.resourceSystem.getResourceAmount('hcu')).toBe(5)
    })

    it('calculates production rates correctly', () => {
      const generator = store.generatorSystem.getGenerator('basicAdBotFarm')!

      // No production when owned = 0
      expect(store.generatorSystem.getGeneratorProductionRate('basicAdBotFarm')).toBe(0)

      // Base production
      generator.owned = 5
      expect(store.generatorSystem.getGeneratorProductionRate('basicAdBotFarm')).toBe(5)

      // With upgrade multiplier
      store.getUpgrade('automatedContentScript')!.isPurchased = true
      expect(store.generatorSystem.getGeneratorProductionRate('basicAdBotFarm')).toBe(6.25)
    })

    it('calculates total production rate', () => {
      store.generatorSystem.getGenerator('basicAdBotFarm')!.owned = 5
      store.generatorSystem.getGenerator('clickbaitEngine')!.owned = 2

      expect(store.productionRate).toBe(25) // (5 * 1) + (2 * 10)
    })
  })

  describe('Upgrade System', () => {
    it('initializes upgrades from config', () => {
      expect(store.gameState.upgrades.length).toBeGreaterThan(0)
      expect(store.gameState.upgrades[0].id).toBe('automatedContentScript')
      expect(store.gameState.upgrades[0].isPurchased).toBe(false)
      // Verify all upgrades have the new structure
      store.gameState.upgrades.forEach((upgrade) => {
        expect(upgrade).toHaveProperty('category')
        expect(upgrade).toHaveProperty('effects')
        expect(Array.isArray(upgrade.effects)).toBe(true)
      })
    })

    it('checks upgrade requirements', () => {
      const upgrade = 'automatedContentScript'

      // Not enough generators
      store.generatorSystem.getGenerator('basicAdBotFarm')!.owned = 3
      expect(store.areUpgradeRequirementsMet(upgrade)).toBe(false)

      // Enough generators
      store.generatorSystem.getGenerator('basicAdBotFarm')!.owned = 5
      expect(store.areUpgradeRequirementsMet(upgrade)).toBe(true)
    })

    it('purchases upgrades when all conditions met', () => {
      store.generatorSystem.getGenerator('basicAdBotFarm')!.owned = 5
      store.resourceSystem.addResource('hcu', 100)

      const result = store.purchaseUpgrade('automatedContentScript')

      expect(result).toBe(true)
      expect(store.getUpgrade('automatedContentScript')!.isPurchased).toBe(true)
      expect(store.resourceSystem.getResourceAmount('hcu')).toBe(50)
    })

    it('prevents purchasing already owned upgrades', () => {
      const upgrade = store.getUpgrade('automatedContentScript')!
      upgrade.isPurchased = true
      store.resourceSystem.addResource('hcu', 100)

      const result = store.purchaseUpgrade('automatedContentScript')

      expect(result).toBe(false)
      expect(store.resourceSystem.getResourceAmount('hcu')).toBe(100)
    })

    it('applies upgrade multipliers to generators', () => {
      const generator = store.generatorSystem.getGenerator('basicAdBotFarm')!
      generator.owned = 4

      // Without upgrade
      expect(store.multiplierSystem.getGeneratorMultiplier('basicAdBotFarm')).toBe(1)

      // With upgrade
      store.getUpgrade('automatedContentScript')!.isPurchased = true
      expect(store.multiplierSystem.getGeneratorMultiplier('basicAdBotFarm')).toBe(1.25)
    })
  })

  describe('Prestige System', () => {
    it('calculates prestige multipliers', () => {
      store.gameState.prestige.level = 0
      expect(store.globalMultiplier).toBe(1)

      store.gameState.prestige.level = 1
      expect(store.globalMultiplier).toBe(1.25)

      store.gameState.prestige.level = 2
      expect(store.globalMultiplier).toBeCloseTo(1.5625, 6)
    })

    it('calculates prestige thresholds', () => {
      store.gameState.prestige.level = 0
      expect(store.prestigeThreshold).toBe(1000)

      store.gameState.prestige.level = 1
      expect(store.prestigeThreshold).toBe(10000)
    })

    it('determines prestige eligibility', () => {
      store.gameState.resources.hcu.current = 999
      expect(store.canPrestige).toBe(false)

      store.gameState.resources.hcu.current = 1000
      expect(store.canPrestige).toBe(true)
    })

    it('performs prestige reset', () => {
      // Setup pre-prestige state
      store.resourceSystem.addResource('hcu', 1000)
      store.generatorSystem.getGenerator('basicAdBotFarm')!.owned = 10
      store.getUpgrade('automatedContentScript')!.isPurchased = true

      const result = store.performPrestige()

      expect(result).toBe(true)
      expect(store.gameState.prestige.level).toBe(1)
      expect(store.resourceSystem.getResourceAmount('hcu')).toBe(0)
      expect(store.generatorSystem.getGenerator('basicAdBotFarm')!.owned).toBe(0)
      expect(store.getUpgrade('automatedContentScript')!.isPurchased).toBe(false)
      expect(store.gameState.resources.hcu.lifetime).toBe(1000) // Lifetime preserved
    })
  })

  describe('Player Actions', () => {
    it('processes manual clicks', () => {
      store.clickForResources()

      expect(store.resourceSystem.getResourceAmount('hcu')).toBe(1)
      expect(store.gameState.resources.hcu.lifetime).toBe(1)
    })

    it('applies prestige multiplier to clicks', () => {
      store.gameState.prestige.level = 1
      store.clickForResources()

      expect(store.resourceSystem.getResourceAmount('hcu')).toBe(1.25)
    })
  })

  describe('State Persistence', () => {
    it('maintains state throughout session', () => {
      store.resourceSystem.addResource('hcu', 100)
      store.generatorSystem.getGenerator('basicAdBotFarm')!.owned = 5

      expect(store.resourceSystem.getResourceAmount('hcu')).toBe(100)
      expect(store.generatorSystem.getGenerator('basicAdBotFarm')!.owned).toBe(5)
    })
  })
})
