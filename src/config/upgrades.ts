export interface UpgradeRequirement {
  generatorId: string
  minOwned: number
}

export interface UpgradeConfig {
  id: string
  name: string
  description: string
  cost: number
  targetGenerator: string
  effectType: 'production_multiplier' | 'global_multiplier'
  effectValue: number
  requirements: UpgradeRequirement[]
  isPurchased: boolean
}

export const AUTOMATED_CONTENT_SCRIPT: UpgradeConfig = {
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
      minOwned: 5,
    },
  ],
  isPurchased: false,
}

export const CLICKBAIT_OPTIMIZER: UpgradeConfig = {
  id: 'clickbaitOptimizer',
  name: 'Clickbait Optimizer',
  description: 'Increases Clickbait Engine production by 50%',
  cost: 250,
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
}

export const upgrades: UpgradeConfig[] = [
  AUTOMATED_CONTENT_SCRIPT,
  CLICKBAIT_OPTIMIZER,
]