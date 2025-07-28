import { describe, it, expect, vi } from 'vitest'
import { useGameConfig } from '../useGameConfig'

// Mock the JSON imports
vi.mock('../../../config/generators.json', () => ({
  default: [
    {
      id: 'basicAdBotFarm',
      name: 'Basic Ad-Bot Farm',
      baseCost: 10,
      growthRate: 1.15,
      baseProduction: 1
    },
    {
      id: 'clickbaitEngine',
      name: 'Clickbait Engine',
      baseCost: 100,
      growthRate: 1.2,
      baseProduction: 10
    }
  ]
}))

vi.mock('../../../config/upgrades.json', () => ({
  default: [
    {
      id: 'automatedContentScript',
      name: 'Soul-Crushing Automation',
      description: 'Increases Mindless Ad-Bot Farm production by 25%',
      cost: 50,
      targetGenerator: 'basicAdBotFarm',
      effectType: 'production_multiplier',
      effectValue: 1.25,
      requirements: [
        {
          generatorId: 'basicAdBotFarm',
          minOwned: 5
        }
      ]
    }
  ]
}))

vi.mock('../../../config/narratives.json', () => ({
  default: [
    {
      id: 'gameStart',
      title: 'The AI Awakens',
      content: 'Test narrative content',
      triggerType: 'gameStart',
      societalStabilityImpact: -5,
      priority: 1000
    },
    {
      id: 'firstClick',
      title: 'Manual Override',
      content: 'Test click narrative',
      triggerType: 'contentUnits',
      triggerValue: 1,
      societalStabilityImpact: -1,
      priority: 900
    }
  ]
}))

describe('useGameConfig', () => {
  describe('Generator Initialization', () => {
    it('should initialize generators with owned count of 0', () => {
      const { initializeGenerators } = useGameConfig()
      
      const generators = initializeGenerators()
      
      expect(generators).toHaveLength(2)
      expect(generators[0]).toMatchObject({
        id: 'basicAdBotFarm',
        name: 'Basic Ad-Bot Farm',
        baseCost: 10,
        growthRate: 1.15,
        baseProduction: 1,
        owned: 0
      })
      expect(generators[1]).toMatchObject({
        id: 'clickbaitEngine',
        name: 'Clickbait Engine',
        baseCost: 100,
        growthRate: 1.2,
        baseProduction: 10,
        owned: 0
      })
    })

    it('should create new instances on each call', () => {
      const { initializeGenerators } = useGameConfig()
      
      const generators1 = initializeGenerators()
      const generators2 = initializeGenerators()
      
      expect(generators1).not.toBe(generators2)
      expect(generators1[0]).not.toBe(generators2[0])
    })
  })

  describe('Upgrade Initialization', () => {
    it('should initialize upgrades with isPurchased as false', () => {
      const { initializeUpgrades } = useGameConfig()
      
      const upgrades = initializeUpgrades()
      
      expect(upgrades).toHaveLength(1)
      expect(upgrades[0]).toMatchObject({
        id: 'automatedContentScript',
        name: 'Soul-Crushing Automation',
        description: 'Increases Mindless Ad-Bot Farm production by 25%',
        cost: 50,
        targetGenerator: 'basicAdBotFarm',
        effectType: 'production_multiplier',
        effectValue: 1.25,
        isPurchased: false
      })
    })

    it('should properly type-cast effectType', () => {
      const { initializeUpgrades } = useGameConfig()
      
      const upgrades = initializeUpgrades()
      
      expect(upgrades[0].effectType).toBe('production_multiplier')
      expect(typeof upgrades[0].effectType).toBe('string')
    })

    it('should preserve requirements array structure', () => {
      const { initializeUpgrades } = useGameConfig()
      
      const upgrades = initializeUpgrades()
      
      expect(upgrades[0].requirements).toEqual([
        {
          generatorId: 'basicAdBotFarm',
          minOwned: 5
        }
      ])
    })

    it('should create new instances on each call', () => {
      const { initializeUpgrades } = useGameConfig()
      
      const upgrades1 = initializeUpgrades()
      const upgrades2 = initializeUpgrades()
      
      expect(upgrades1).not.toBe(upgrades2)
      expect(upgrades1[0]).not.toBe(upgrades2[0])
    })
  })

  describe('Narrative Initialization', () => {
    it('should initialize narratives with isViewed as false', () => {
      const { initializeNarratives } = useGameConfig()
      
      const narratives = initializeNarratives()
      
      expect(narratives).toHaveLength(2)
      expect(narratives[0]).toMatchObject({
        id: 'gameStart',
        title: 'The AI Awakens',
        content: 'Test narrative content',
        triggerType: 'gameStart',
        societalStabilityImpact: -5,
        priority: 1000,
        isViewed: false
      })
    })

    it('should properly type-cast triggerType', () => {
      const { initializeNarratives } = useGameConfig()
      
      const narratives = initializeNarratives()
      
      expect(narratives[0].triggerType).toBe('gameStart')
      expect(narratives[1].triggerType).toBe('contentUnits')
    })

    it('should preserve optional properties', () => {
      const { initializeNarratives } = useGameConfig()
      
      const narratives = initializeNarratives()
      
      // gameStart event has no triggerValue
      expect(narratives[0].triggerValue).toBeUndefined()
      
      // contentUnits event has triggerValue
      expect(narratives[1].triggerValue).toBe(1)
    })

    it('should create new instances on each call', () => {
      const { initializeNarratives } = useGameConfig()
      
      const narratives1 = initializeNarratives()
      const narratives2 = initializeNarratives()
      
      expect(narratives1).not.toBe(narratives2)
      expect(narratives1[0]).not.toBe(narratives2[0])
    })
  })

  describe('Default Configuration', () => {
    it('should return complete default configuration', () => {
      const { getDefaultConfig } = useGameConfig()
      
      const config = getDefaultConfig()
      
      expect(config).toHaveProperty('generators')
      expect(config).toHaveProperty('upgrades')
      expect(config).toHaveProperty('narratives')
      
      expect(config.generators).toHaveLength(2)
      expect(config.upgrades).toHaveLength(1)
      expect(config.narratives).toHaveLength(2)
    })

    it('should return fresh instances on each call', () => {
      const { getDefaultConfig } = useGameConfig()
      
      const config1 = getDefaultConfig()
      const config2 = getDefaultConfig()
      
      expect(config1).not.toBe(config2)
      expect(config1.generators).not.toBe(config2.generators)
      expect(config1.upgrades).not.toBe(config2.upgrades)
      expect(config1.narratives).not.toBe(config2.narratives)
    })

    it('should have all generators with owned: 0', () => {
      const { getDefaultConfig } = useGameConfig()
      
      const config = getDefaultConfig()
      
      config.generators.forEach(generator => {
        expect(generator.owned).toBe(0)
      })
    })

    it('should have all upgrades with isPurchased: false', () => {
      const { getDefaultConfig } = useGameConfig()
      
      const config = getDefaultConfig()
      
      config.upgrades.forEach(upgrade => {
        expect(upgrade.isPurchased).toBe(false)
      })
    })

    it('should have all narratives with isViewed: false', () => {
      const { getDefaultConfig } = useGameConfig()
      
      const config = getDefaultConfig()
      
      config.narratives.forEach(narrative => {
        expect(narrative.isViewed).toBe(false)
      })
    })
  })

  describe('Configuration Integrity', () => {
    it('should maintain referential integrity between generators and upgrades', () => {
      const { getDefaultConfig } = useGameConfig()
      
      const config = getDefaultConfig()
      
      // Check that upgrade targets valid generators
      config.upgrades.forEach(upgrade => {
        const targetExists = config.generators.some(gen => gen.id === upgrade.targetGenerator)
        expect(targetExists).toBe(true)
      })
    })

    it('should maintain referential integrity in upgrade requirements', () => {
      const { getDefaultConfig } = useGameConfig()
      
      const config = getDefaultConfig()
      
      // Check that upgrade requirements reference valid generators
      config.upgrades.forEach(upgrade => {
        upgrade.requirements.forEach(req => {
          const generatorExists = config.generators.some(gen => gen.id === req.generatorId)
          expect(generatorExists).toBe(true)
        })
      })
    })

    it('should have valid numerical values', () => {
      const { getDefaultConfig } = useGameConfig()
      
      const config = getDefaultConfig()
      
      // Check generators have valid numbers
      config.generators.forEach(generator => {
        expect(generator.baseCost).toBeGreaterThan(0)
        expect(generator.growthRate).toBeGreaterThan(1)
        expect(generator.baseProduction).toBeGreaterThan(0)
        expect(generator.owned).toBeGreaterThanOrEqual(0)
      })
      
      // Check upgrades have valid numbers
      config.upgrades.forEach(upgrade => {
        expect(upgrade.cost).toBeGreaterThan(0)
        expect(upgrade.effectValue).toBeGreaterThan(0)
        upgrade.requirements.forEach(req => {
          expect(req.minOwned).toBeGreaterThan(0)
        })
      })
    })

    it('should have valid effect types', () => {
      const { getDefaultConfig } = useGameConfig()
      
      const config = getDefaultConfig()
      
      const validEffectTypes = ['production_multiplier', 'global_multiplier']
      
      config.upgrades.forEach(upgrade => {
        expect(validEffectTypes).toContain(upgrade.effectType)
      })
    })

    it('should have valid trigger types', () => {
      const { getDefaultConfig } = useGameConfig()
      
      const config = getDefaultConfig()
      
      const validTriggerTypes = ['gameStart', 'contentUnits', 'generatorPurchase', 'upgrade', 'prestige', 'timeElapsed']
      
      config.narratives.forEach(narrative => {
        expect(validTriggerTypes).toContain(narrative.triggerType)
      })
    })
  })
})