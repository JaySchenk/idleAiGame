import { type ComputedRef } from 'vue'
import type { GameState } from '../stores/gameStore'

export function useMultipliers(gameState: ComputedRef<GameState>) {
  /**
   * Get generator-specific multiplier from upgrades
   */
  function getGeneratorMultiplier(generatorId: string): number {
    let multiplier = 1
    for (const upgrade of gameState.value.upgrades) {
      if (upgrade.isPurchased) {
        for (const effect of upgrade.effects) {
          if (effect.type === 'production_multiplier' && effect.targetId === generatorId) {
            multiplier *= effect.value
          }
        }
      }
    }
    return multiplier
  }

  /**
   * Get click multiplier from upgrades
   */
  function getClickMultiplier(): number {
    let multiplier = 1
    for (const upgrade of gameState.value.upgrades) {
      if (upgrade.isPurchased) {
        for (const effect of upgrade.effects) {
          if (effect.type === 'click_multiplier') {
            multiplier *= effect.value
          }
        }
      }
    }
    return multiplier
  }

  /**
   * Get resource-specific global multiplier from upgrades
   */
  function getGlobalResourceMultiplier(resourceId: string): number {
    let multiplier = 1
    for (const upgrade of gameState.value.upgrades) {
      if (upgrade.isPurchased) {
        for (const effect of upgrade.effects) {
          if (effect.type === 'global_resource_multiplier' && effect.targetId === resourceId) {
            multiplier *= effect.value
          }
        }
      }
    }
    return multiplier
  }

  /**
   * Get resource capacity modification from upgrades
   */
  function getResourceCapacityModification(resourceId: string): number {
    let modification = 0
    for (const upgrade of gameState.value.upgrades) {
      if (upgrade.isPurchased) {
        for (const effect of upgrade.effects) {
          if (effect.type === 'resource_capacity' && effect.targetId === resourceId) {
            modification += effect.value
          }
        }
      }
    }
    return modification
  }

  /**
   * Get decay rate multiplier from upgrades
   */
  function getDecayRateMultiplier(resourceId: string): number {
    let multiplier = 1
    for (const upgrade of gameState.value.upgrades) {
      if (upgrade.isPurchased) {
        for (const effect of upgrade.effects) {
          if (effect.type === 'decay_reduction' && effect.targetId === resourceId) {
            multiplier *= effect.value
          }
        }
      }
    }
    return multiplier
  }

  return {
    getGeneratorMultiplier,
    getClickMultiplier,
    getGlobalResourceMultiplier,
    getResourceCapacityModification,
    getDecayRateMultiplier,
  }
}
