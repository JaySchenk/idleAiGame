export interface UpgradeRequirement {
  generatorId: string
  minOwned: number
}

export interface UpgradeResourceCost {
  resourceId: string
  amount: number
}

export interface UpgradeConfig {
  id: string
  name: string
  description: string
  costs: UpgradeResourceCost[]
  targetGenerator: string
  effectType: 'production_multiplier' | 'global_multiplier'
  effectValue: number
  requirements: UpgradeRequirement[]
  isPurchased: boolean
}

export const upgrades: UpgradeConfig[] = [
  {
    id: 'automatedContentScript',
    name: 'Soul-Crushing Automation',
    description: 'Increases Mindless Ad-Bot Farm production by 25%',
    costs: [{ resourceId: 'hcu', amount: 50 }],
    targetGenerator: 'basicAdBotFarm',
    effectType: 'production_multiplier',
    effectValue: 1.25,
    requirements: [
      {
        generatorId: 'basicAdBotFarm',
        minOwned: 5,
      },
    ],
    isPurchased: false,
  },
  {
    id: 'clickbaitOptimizer',
    name: 'Clickbait Optimizer',
    description: 'Increases Clickbait Engine production by 50%',
    costs: [{ resourceId: 'hcu', amount: 250 }],
    targetGenerator: 'clickbaitEngine',
    effectType: 'production_multiplier',
    effectValue: 1.5,
    requirements: [
      {
        generatorId: 'clickbaitEngine',
        minOwned: 3,
      },
    ],
    isPurchased: false,
  },
]
