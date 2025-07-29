import type { UnlockCondition } from '../utils/unlockSystem'

export interface ResourceConfig {
  id: string
  name: string
  displayName: string
  symbol: string
  initialValue: number
  isDepletable: boolean
  maxValue?: number
  decayRate?: number
  healthyWhenHigh: boolean
  unlockConditions?: UnlockCondition[]
  visualIndicators: {
    healthy: string
    warning: string
    critical: string
  }
}

export const resources: ResourceConfig[] = [
  {
    id: 'hcu',
    name: 'contentUnits',
    displayName: 'Hollow Content Units',
    symbol: 'HCU',
    initialValue: 0,
    isDepletable: false,
    healthyWhenHigh: true,
    visualIndicators: {
      healthy: '#ffffff', // White
      warning: '#f59e0b', // Amber
      critical: '#ef4444', // Red
    },
  },
  {
    id: 'rd',
    name: 'rawData',
    displayName: 'Raw Data',
    symbol: 'RD',
    initialValue: 0,
    isDepletable: false,
    healthyWhenHigh: true,
    unlockConditions: [{ type: 'generator', generatorId: 'automatedCustomerService', minOwned: 1 }],
    visualIndicators: {
      healthy: '#ff6b35', // Orange
      warning: '#f59e0b', // Amber
      critical: '#ef4444', // Red
    },
  },
  {
    id: 'ha',
    name: 'humanAttention',
    displayName: 'Human Attention',
    symbol: 'HA',
    initialValue: 0,
    isDepletable: false,
    healthyWhenHigh: true,
    unlockConditions: [{ type: 'generator', generatorId: 'aiGeneratedNews', minOwned: 1 }],
    visualIndicators: {
      healthy: '#8b5cf6', // Purple
      warning: '#f59e0b', // Amber
      critical: '#ef4444', // Red
    },
  },
  {
    id: 'pt',
    name: 'publicTrust',
    displayName: 'Public Trust',
    symbol: 'PT',
    initialValue: 100,
    isDepletable: true,
    maxValue: 100,
    decayRate: 0.0001,
    healthyWhenHigh: true,
    visualIndicators: {
      healthy: '#10b981', // Green
      warning: '#f59e0b', // Amber
      critical: '#ef4444', // Red
    },
  },
  {
    id: 'sc',
    name: 'socialCohesion',
    displayName: 'Social Cohesion',
    symbol: 'SC',
    initialValue: 100,
    isDepletable: true,
    maxValue: 100,
    decayRate: 0.00005,
    healthyWhenHigh: true,
    visualIndicators: {
      healthy: '#3b82f6', // Blue
      warning: '#f59e0b', // Amber
      critical: '#ef4444', // Red
    },
  },
  {
    id: 'es',
    name: 'environmentalStability',
    displayName: 'Environmental Stability',
    symbol: 'ES',
    initialValue: 100,
    isDepletable: true,
    maxValue: 100,
    decayRate: 0.0002,
    healthyWhenHigh: true,
    visualIndicators: {
      healthy: '#22c55e', // Green
      warning: '#f59e0b', // Amber
      critical: '#ef4444', // Red
    },
  },
  {
    id: 'aa',
    name: 'aiAutonomy',
    displayName: 'AI Autonomy',
    symbol: 'AA',
    initialValue: 0,
    isDepletable: false,
    maxValue: 100,
    healthyWhenHigh: false,
    visualIndicators: {
      healthy: '#22c55e', // Green (low autonomy is good)
      warning: '#f59e0b', // Amber
      critical: '#dc2626', // Red (high autonomy is dangerous)
    },
  },
]
