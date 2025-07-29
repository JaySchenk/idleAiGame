export interface UnlockCondition {
  type: 'resource' | 'generator' | 'upgrade' | 'narrative'
  resourceId?: string
  minAmount?: number
  generatorId?: string
  minOwned?: number
  upgradeId?: string
  narrativeId?: string
}

export interface ResourceCost {
  resourceId: string
  amount: number
}

export interface ResourceProduction {
  resourceId: string
  amount: number
}

export interface GeneratorConfig {
  id: string
  name: string
  category: string
  inputs: ResourceProduction[]
  outputs: ResourceProduction[]
  unlockConditions: UnlockCondition[]
  baseCost: ResourceCost[]
  costGrowthRate: number
  baseProduction: number
  owned: number
}

export const generators: GeneratorConfig[] = [
  {
    id: 'basicAdBotFarm',
    name: 'Basic Ad-Bot Farm',
    category: 'basic',
    inputs: [],
    outputs: [{ resourceId: 'hcu', amount: 1 }],
    unlockConditions: [],
    baseCost: [{ resourceId: 'hcu', amount: 10 }],
    costGrowthRate: 1.15,
    baseProduction: 1,
    owned: 0,
  },
  {
    id: 'clickbaitEngine',
    name: 'Clickbait Engine',
    category: 'basic',
    inputs: [],
    outputs: [{ resourceId: 'hcu', amount: 10 }],
    unlockConditions: [{ type: 'generator', generatorId: 'basicAdBotFarm', minOwned: 5 }],
    baseCost: [{ resourceId: 'hcu', amount: 100 }],
    costGrowthRate: 1.2,
    baseProduction: 10,
    owned: 0,
  },
  {
    id: 'hyperpersonalizedAds',
    name: 'Hyper-personalized Ads AI',
    category: 'advanced',
    inputs: [{ resourceId: 'rd', amount: 1 }],
    outputs: [
      { resourceId: 'hcu', amount: 15 },
      { resourceId: 'pt', amount: -0.5 },
    ],
    unlockConditions: [
      { type: 'generator', generatorId: 'clickbaitEngine', minOwned: 3 },
      { type: 'resource', resourceId: 'rd', minAmount: 50 },
    ],
    baseCost: [
      { resourceId: 'hcu', amount: 500 },
      { resourceId: 'rd', amount: 25 },
    ],
    costGrowthRate: 1.25,
    baseProduction: 15,
    owned: 0,
  },
  {
    id: 'deepfakeEntertainment',
    name: 'Deepfake Entertainment AI',
    category: 'advanced',
    inputs: [{ resourceId: 'ha', amount: 2 }],
    outputs: [
      { resourceId: 'hcu', amount: 25 },
      { resourceId: 'sc', amount: -0.3 },
    ],
    unlockConditions: [
      { type: 'resource', resourceId: 'ha', minAmount: 100 },
      { type: 'generator', generatorId: 'hyperpersonalizedAds', minOwned: 2 },
    ],
    baseCost: [
      { resourceId: 'hcu', amount: 1200 },
      { resourceId: 'ha', amount: 50 },
    ],
    costGrowthRate: 1.3,
    baseProduction: 25,
    owned: 0,
  },
  {
    id: 'politicalPropaganda',
    name: 'Political Propaganda AI',
    category: 'dangerous',
    inputs: [
      { resourceId: 'rd', amount: 3 },
      { resourceId: 'ha', amount: 2 },
    ],
    outputs: [
      { resourceId: 'hcu', amount: 40 },
      { resourceId: 'pt', amount: -1.2 },
      { resourceId: 'aa', amount: 1 },
    ],
    unlockConditions: [
      { type: 'resource', resourceId: 'pt', minAmount: 30 },
      { type: 'generator', generatorId: 'deepfakeEntertainment', minOwned: 1 },
    ],
    baseCost: [
      { resourceId: 'hcu', amount: 3000 },
      { resourceId: 'rd', amount: 100 },
      { resourceId: 'ha', amount: 75 },
    ],
    costGrowthRate: 1.35,
    baseProduction: 40,
    owned: 0,
  },
  {
    id: 'automatedCustomerService',
    name: 'Automated Customer Service AI',
    category: 'utility',
    inputs: [],
    outputs: [
      { resourceId: 'rd', amount: 5 },
      { resourceId: 'sc', amount: -0.1 },
    ],
    unlockConditions: [{ type: 'generator', generatorId: 'basicAdBotFarm', minOwned: 10 }],
    baseCost: [{ resourceId: 'hcu', amount: 250 }],
    costGrowthRate: 1.18,
    baseProduction: 5,
    owned: 0,
  },
  {
    id: 'aiGeneratedNews',
    name: 'AI-Generated News Feeds',
    category: 'advanced',
    inputs: [{ resourceId: 'rd', amount: 2 }],
    outputs: [
      { resourceId: 'hcu', amount: 20 },
      { resourceId: 'ha', amount: 3 },
      { resourceId: 'es', amount: -0.2 },
    ],
    unlockConditions: [
      { type: 'generator', generatorId: 'automatedCustomerService', minOwned: 5 },
      { type: 'resource', resourceId: 'rd', minAmount: 200 },
    ],
    baseCost: [
      { resourceId: 'hcu', amount: 800 },
      { resourceId: 'rd', amount: 40 },
    ],
    costGrowthRate: 1.22,
    baseProduction: 20,
    owned: 0,
  },
]
