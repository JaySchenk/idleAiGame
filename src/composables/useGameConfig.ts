import { generators, type GeneratorConfig } from '../config/generators'
import { upgrades, type UpgradeConfig } from '../config/upgrades'
import { narratives, type NarrativeEvent } from '../config/narratives'

export type { GeneratorConfig, UpgradeConfig, NarrativeEvent }

/**
 * Game configuration composable that handles loading and initializing
 * game data from TypeScript configuration files
 */
export function useGameConfig() {
  /**
   * Initialize generators with default owned count of 0
   */
  function initializeGenerators(): GeneratorConfig[] {
    return generators.map(config => ({
      ...config,
      owned: 0,
    }))
  }
  
  /**
   * Initialize upgrades with purchased state
   */
  function initializeUpgrades(): UpgradeConfig[] {
    return upgrades.map(config => ({
      ...config,
      isPurchased: false,
    }))
  }
  
  /**
   * Initialize narrative events with viewed state
   */
  function initializeNarratives(): NarrativeEvent[] {
    return narratives.map(config => ({
      ...config,
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