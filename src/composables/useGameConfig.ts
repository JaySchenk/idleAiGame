import type { NarrativeEvent } from '../assets/narratives'
import generatorsConfig from '../../config/generators.json'
import upgradesConfig from '../../config/upgrades.json'
import narrativesConfig from '../../config/narratives.json'

export interface GeneratorConfig {
  id: string
  name: string
  baseCost: number
  growthRate: number
  baseProduction: number
  owned: number
}

export interface UpgradeConfig {
  id: string
  name: string
  description: string
  cost: number
  targetGenerator: string
  effectType: 'production_multiplier' | 'global_multiplier'
  effectValue: number
  requirements: {
    generatorId: string
    minOwned: number
  }[]
  isPurchased: boolean
}

/**
 * Game configuration composable that handles loading and initializing
 * game data from JSON configuration files
 */
export function useGameConfig() {
  /**
   * Initialize generators with default owned count of 0
   */
  function initializeGenerators(): GeneratorConfig[] {
    return generatorsConfig.map(config => ({
      ...config,
      owned: 0,
    }))
  }
  
  /**
   * Initialize upgrades with proper type casting and purchased state
   */
  function initializeUpgrades(): UpgradeConfig[] {
    return upgradesConfig.map(config => ({
      ...config,
      effectType: config.effectType as 'production_multiplier' | 'global_multiplier',
      isPurchased: false,
    }))
  }
  
  /**
   * Initialize narrative events with proper type casting and viewed state
   */
  function initializeNarratives(): NarrativeEvent[] {
    return narrativesConfig.map(config => ({
      ...config,
      triggerType: config.triggerType as 'gameStart' | 'contentUnits' | 'generatorPurchase' | 'upgrade' | 'prestige' | 'timeElapsed',
      isViewed: false
    }))
  }
  
  /**
   * Get default game configuration
   */
  function getDefaultConfig() {
    return {
      generators: initializeGenerators(),
      upgrades: initializeUpgrades(),
      narratives: initializeNarratives(),
    }
  }
  
  return {
    initializeGenerators,
    initializeUpgrades,
    initializeNarratives,
    getDefaultConfig,
  }
}