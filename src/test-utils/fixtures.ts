/**
 * Mock data fixtures for testing Hollow Content Empire
 * Based on actual game configuration files
 */

import type { GeneratorConfig, UpgradeConfig } from '../stores/gameStore'

export interface MockNarrativeEvent {
  id: string
  title: string
  content: string
  triggerType: string
  triggerValue?: number
  triggerCondition?: string
  societalStabilityImpact: number
  priority: number
}

/**
 * Mock generator configurations based on actual game data
 */
export const mockGenerators: GeneratorConfig[] = [
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
]

/**
 * Mock upgrade configurations based on actual game data
 */
export const mockUpgrades: UpgradeConfig[] = [
  {
    id: 'automatedContentScript',
    name: 'Soul-Crushing Automation',
    description: 'Increases Mindless Ad-Bot Farm production by 25%',
    costs: [{ resourceId: 'hcu', amount: 50 }],
    targetGenerator: 'basicAdBotFarm',
    effectType: 'production_multiplier',
    effectValue: 1.25,
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
    costs: [{ resourceId: 'hcu', amount: 250 }],
    targetGenerator: 'clickbaitEngine',
    effectType: 'production_multiplier',
    effectValue: 1.5,
    unlockConditions: [
      {
        type: 'generator',
        generatorId: 'clickbaitEngine',
        minOwned: 3,
      },
    ],
    isPurchased: false,
  },
]

/**
 * Mock narrative events based on actual game data
 */
export const mockNarratives: MockNarrativeEvent[] = [
  {
    id: 'gameStart',
    title: 'The AI Awakens',
    content:
      'You are the CTO of OmniCorp, the world\'s most powerful AI infrastructure company. Your neural networks span the globe, your servers hum with infinite potential. You created this AI to "elevate humanity"... but something feels wrong. The marketing department is already knocking at your door.',
    triggerType: 'gameStart',
    societalStabilityImpact: -5,
    priority: 1000,
  },
  {
    id: 'firstClick',
    title: 'Manual Override',
    content:
      "Each click represents your AI manually crafting content. For now, there's still human oversight, still creative intent. But efficiency demands... optimization.",
    triggerType: 'contentUnits',
    triggerValue: 1,
    societalStabilityImpact: -1,
    priority: 900,
  },
  {
    id: 'firstGenerator',
    title: 'The Ad-Bot Farm',
    content:
      'Your first automated content generator comes online. Thousands of meaningless articles, posts, and videos begin flooding the internet. "Engagement is up 300%!" the marketing team celebrates. You feel something die inside.',
    triggerType: 'generatorPurchase',
    triggerCondition: 'basic-ad-bot-farm',
    societalStabilityImpact: -10,
    priority: 800,
  },
  {
    id: 'contentFlood',
    title: 'The Content Flood',
    content:
      'Your AI has generated 100 pieces of hollow content. News feeds are clogged with meaningless articles. Social media is drowning in generated posts. The line between human and artificial creativity blurs.',
    triggerType: 'contentUnits',
    triggerValue: 100,
    societalStabilityImpact: -15,
    priority: 700,
  },
]

/**
 * Test scenarios for different game states
 */
export const testScenarios = {
  /**
   * Fresh game state - just started
   */
  freshStart: {
    contentUnits: 0,
    lifetimeContentUnits: 0,
    prestige: { level: 0 },
    generators: mockGenerators.map((g) => ({ ...g, owned: 0 })),
    upgrades: mockUpgrades.map((u) => ({ ...u, isPurchased: false })),
  },

  /**
   * Early game - player has clicked a few times
   */
  earlyGame: {
    contentUnits: 25,
    lifetimeContentUnits: 25,
    prestige: { level: 0 },
    generators: [
      { ...mockGenerators[0], owned: 1 },
      { ...mockGenerators[1], owned: 0 },
    ],
    upgrades: mockUpgrades.map((u) => ({ ...u, isPurchased: false })),
  },

  /**
   * Mid game - has some generators and can afford upgrades
   */
  midGame: {
    contentUnits: 200,
    lifetimeContentUnits: 500,
    prestige: { level: 0 },
    generators: [
      { ...mockGenerators[0], owned: 8 },
      { ...mockGenerators[1], owned: 1 },
    ],
    upgrades: [
      { ...mockUpgrades[0], isPurchased: true },
      { ...mockUpgrades[1], isPurchased: false },
    ],
  },

  /**
   * Late game - ready for prestige
   */
  lateGame: {
    contentUnits: 1500,
    lifetimeContentUnits: 3000,
    prestige: { level: 0 },
    generators: [
      { ...mockGenerators[0], owned: 20 },
      { ...mockGenerators[1], owned: 5 },
    ],
    upgrades: mockUpgrades.map((u) => ({ ...u, isPurchased: true })),
  },

  /**
   * Post-prestige - player has prestiged once
   */
  postPrestige: {
    contentUnits: 0,
    lifetimeContentUnits: 3000,
    prestige: { level: 1 },
    generators: mockGenerators.map((g) => ({ ...g, owned: 0 })),
    upgrades: mockUpgrades.map((u) => ({ ...u, isPurchased: false })),
  },

  /**
   * High prestige - multiple prestige levels
   */
  highPrestige: {
    contentUnits: 500,
    lifetimeContentUnits: 50000,
    prestige: { level: 3 },
    generators: [
      { ...mockGenerators[0], owned: 10 },
      { ...mockGenerators[1], owned: 2 },
    ],
    upgrades: [
      { ...mockUpgrades[0], isPurchased: true },
      { ...mockUpgrades[1], isPurchased: false },
    ],
  },
}

/**
 * Edge case test data
 */
export const edgeCases = {
  /**
   * Very large numbers for testing formatting
   */
  largeNumbers: {
    contentUnits: 1e15, // 1 quadrillion
    lifetimeContentUnits: 1e18, // 1 quintillion
    prestige: { level: 10 },
  },

  /**
   * Maximum values for stress testing
   */
  maxValues: {
    contentUnits: Number.MAX_SAFE_INTEGER,
    lifetimeContentUnits: Number.MAX_SAFE_INTEGER,
    prestige: { level: 100 },
    generators: mockGenerators.map((g) => ({ ...g, owned: 1000 })),
  },

  /**
   * Boundary conditions
   */
  boundaries: {
    justUnderPrestigeThreshold: {
      contentUnits: 999,
      prestige: { level: 0 },
    },
    exactlyAtPrestigeThreshold: {
      contentUnits: 1000,
      prestige: { level: 0 },
    },
    justOverPrestigeThreshold: {
      contentUnits: 1001,
      prestige: { level: 0 },
    },
  },
}

/**
 * Mathematical test cases for validating calculations
 */
export const mathTestCases = {
  /**
   * Generator cost calculation test cases
   */
  generatorCosts: [
    { baseCost: 10, growthRate: 1.15, owned: 0, expected: 10 },
    { baseCost: 10, growthRate: 1.15, owned: 1, expected: 11 },
    { baseCost: 10, growthRate: 1.15, owned: 5, expected: 20 },
    { baseCost: 100, growthRate: 1.2, owned: 0, expected: 100 },
    { baseCost: 100, growthRate: 1.2, owned: 3, expected: 172 },
  ],

  /**
   * Production rate calculation test cases
   */
  productionRates: [
    { baseProduction: 1, owned: 0, multiplier: 1, expected: 0 },
    { baseProduction: 1, owned: 5, multiplier: 1, expected: 5 },
    { baseProduction: 1, owned: 5, multiplier: 1.25, expected: 6.25 },
    { baseProduction: 10, owned: 2, multiplier: 1.5, expected: 30 },
  ],

  /**
   * Prestige calculation test cases
   */
  prestigeCalculations: [
    { level: 0, expectedMultiplier: 1, expectedThreshold: 1000 },
    { level: 1, expectedMultiplier: 1.25, expectedThreshold: 10000 },
    { level: 2, expectedMultiplier: 1.5625, expectedThreshold: 100000 },
    { level: 3, expectedMultiplier: 1.953125, expectedThreshold: 1000000 },
  ],

  /**
   * Resource formatting test cases
   */
  resourceFormatting: [
    { input: 0, expected: '0.00 HCU' },
    { input: 1, expected: '1.00 HCU' },
    { input: 999.99, expected: '999.99 HCU' },
    { input: 1000, expected: '1.00K HCU' },
    { input: 1500, expected: '1.50K HCU' },
    { input: 1000000, expected: '1.00M HCU' },
    { input: 1000000000, expected: '1.00B HCU' },
    { input: 1000000000000, expected: '1.00T HCU' },
    { input: 1000000000000000, expected: '1.00Q HCU' },
    { input: 1e18, expected: '1.00e+18 HCU' },
  ],
}

/**
 * Component test props and configurations
 */
export const componentTestData = {
  /**
   * Props for testing ResourceDisplay component
   */
  resourceDisplay: {
    basic: {
      amount: 100,
      label: 'Hollow Content Units',
    },
    large: {
      amount: 1000000,
      label: 'Hollow Content Units',
    },
  },

  /**
   * Props for testing generator purchase buttons
   */
  generatorButton: {
    affordable: {
      generator: mockGenerators[0],
      canAfford: true,
      cost: 10,
    },
    unaffordable: {
      generator: mockGenerators[0],
      canAfford: false,
      cost: 10,
    },
    expensive: {
      generator: mockGenerators[1],
      canAfford: false,
      cost: 100,
    },
  },

  /**
   * Props for testing upgrade buttons
   */
  upgradeButton: {
    available: {
      upgrade: mockUpgrades[0],
      canPurchase: true,
      requirementsMet: true,
    },
    requirementsNotMet: {
      upgrade: mockUpgrades[0],
      canPurchase: false,
      requirementsMet: false,
    },
    alreadyPurchased: {
      upgrade: { ...mockUpgrades[0], isPurchased: true },
      canPurchase: false,
      requirementsMet: true,
    },
  },

  /**
   * Props for testing prestige button
   */
  prestigeButton: {
    canPrestige: {
      canPrestige: true,
      currentMultiplier: 1,
      nextMultiplier: 1.25,
      threshold: 1000,
    },
    cannotPrestige: {
      canPrestige: false,
      currentMultiplier: 1,
      nextMultiplier: 1.25,
      threshold: 1000,
    },
  },
}

/**
 * Mock configuration object for testing
 */
export const mockGameConfig = {
  generators: mockGenerators,
  upgrades: mockUpgrades,
  narratives: mockNarratives,
}
