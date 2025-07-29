import type { UnlockCondition } from '../utils/unlockSystem'

export interface UpgradeResourceCost {
  resourceId: string
  amount: number
}

export interface UpgradeEffect {
  type:
    | 'production_multiplier'
    | 'resource_capacity'
    | 'decay_reduction'
    | 'click_multiplier'
    | 'global_resource_multiplier'
  targetId?: string
  value: number
}

export interface UpgradeConfig {
  id: string
  name: string
  description: string
  category: 'production' | 'efficiency' | 'milestone' | 'choice'
  costs: UpgradeResourceCost[]
  effects: UpgradeEffect[]
  unlockConditions: UnlockCondition[]
  isPurchased: boolean
}

export const upgrades: UpgradeConfig[] = [
  {
    id: 'automatedContentScript',
    name: 'Soul-Crushing Automation',
    description: 'Increases Mindless Ad-Bot Farm production by 25%',
    category: 'production',
    costs: [{ resourceId: 'hcu', amount: 50 }],
    effects: [
      {
        type: 'production_multiplier',
        targetId: 'basicAdBotFarm',
        value: 1.25,
      },
    ],
    unlockConditions: [
      {
        type: 'generator',
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
    category: 'production',
    costs: [{ resourceId: 'hcu', amount: 250 }],
    effects: [
      {
        type: 'production_multiplier',
        targetId: 'clickbaitEngine',
        value: 1.5,
      },
    ],
    unlockConditions: [
      {
        type: 'generator',
        generatorId: 'clickbaitEngine',
        minOwned: 3,
      },
    ],
    isPurchased: false,
  },

  // ===== EFFICIENCY UPGRADES =====
  {
    id: 'ergonomicMousePad',
    name: 'Ergonomic Mouse Pad',
    description:
      'Doubles your clicking efficiency but slightly reduces AI autonomy through human intervention',
    category: 'efficiency',
    costs: [{ resourceId: 'hcu', amount: 100 }],
    effects: [
      {
        type: 'click_multiplier',
        value: 2.0,
      },
      {
        type: 'global_resource_multiplier',
        targetId: 'aa',
        value: 0.95,
      },
    ],
    unlockConditions: [
      {
        type: 'resource',
        resourceId: 'hcu',
        minAmount: 75,
      },
    ],
    isPurchased: false,
  },

  // ===== CHOICE UPGRADES (Branching Paths) =====
  {
    id: 'corporateEfficiency',
    name: 'Corporate Efficiency Protocol',
    description:
      'Maximize profit at the cost of public trust. Cannot coexist with ethical practices.',
    category: 'choice',
    costs: [{ resourceId: 'hcu', amount: 500 }],
    effects: [
      {
        type: 'global_resource_multiplier',
        targetId: 'hcu',
        value: 1.5,
      },
      {
        type: 'decay_reduction',
        targetId: 'pt',
        value: 1.5,
      },
    ],
    unlockConditions: [
      {
        type: 'resource',
        resourceId: 'hcu',
        minAmount: 400,
      },
      {
        type: 'not_upgrade',
        upgradeId: 'ethicalPractices',
      },
    ],
    isPurchased: false,
  },
  {
    id: 'ethicalPractices',
    name: 'Ethical AI Guidelines',
    description:
      'Maintain public trust but sacrifice maximum efficiency. Cannot coexist with corporate protocols.',
    category: 'choice',
    costs: [{ resourceId: 'hcu', amount: 500 }],
    effects: [
      {
        type: 'decay_reduction',
        targetId: 'pt',
        value: 0.5,
      },
      {
        type: 'global_resource_multiplier',
        targetId: 'hcu',
        value: 0.8,
      },
    ],
    unlockConditions: [
      {
        type: 'resource',
        resourceId: 'hcu',
        minAmount: 400,
      },
      {
        type: 'not_upgrade',
        upgradeId: 'corporateEfficiency',
      },
    ],
    isPurchased: false,
  },

  // ===== MILESTONE UPGRADES =====
  {
    id: 'emergencyProtocols',
    name: 'Emergency Resource Protocols',
    description: 'Increases maximum capacity for critical resources during crisis situations',
    category: 'milestone',
    costs: [{ resourceId: 'hcu', amount: 1000 }],
    effects: [
      {
        type: 'resource_capacity',
        targetId: 'pt',
        value: 25,
      },
      {
        type: 'resource_capacity',
        targetId: 'sc',
        value: 25,
      },
      {
        type: 'resource_capacity',
        targetId: 'es',
        value: 25,
      },
    ],
    unlockConditions: [
      {
        type: 'multiple',
        logic: 'OR',
        conditions: [
          {
            type: 'resource',
            resourceId: 'pt',
            maxAmount: 25,
          },
          {
            type: 'resource',
            resourceId: 'sc',
            maxAmount: 25,
          },
          {
            type: 'resource',
            resourceId: 'es',
            maxAmount: 25,
          },
        ],
      },
    ],
    isPurchased: false,
  },

  // ===== COMPLEX MULTI-EFFECT UPGRADE =====
  {
    id: 'aiSymbiosis',
    name: 'Human-AI Symbiosis',
    description:
      'A breakthrough in human-AI collaboration. Balances efficiency with sustainability.',
    category: 'milestone',
    costs: [
      { resourceId: 'hcu', amount: 2000 },
      { resourceId: 'ha', amount: 50 },
    ],
    effects: [
      {
        type: 'click_multiplier',
        value: 1.5,
      },
      {
        type: 'production_multiplier',
        targetId: 'basicAdBotFarm',
        value: 1.3,
      },
      {
        type: 'decay_reduction',
        targetId: 'sc',
        value: 0.8,
      },
      {
        type: 'global_resource_multiplier',
        targetId: 'aa',
        value: 0.9,
      },
    ],
    unlockConditions: [
      {
        type: 'resource',
        resourceId: 'ha',
        minAmount: 30,
      },
      {
        type: 'prestige',
        minPrestigeLevel: 1,
      },
    ],
    isPurchased: false,
  },
]
