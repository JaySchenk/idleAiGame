import type { ComputedRef } from 'vue'
import type { GameState } from '../stores/gameStore'
import { resources, type ResourceConfig } from '../config/resources'
import { GAME_CONSTANTS } from '../config/gameConstants'
import { UnlockSystem } from '../game/unlockSystem'
import { useMultipliers } from './useMultipliers'

export interface ResourceState {
  current: number
  lifetime: number
}

export function useResources(gameState: ComputedRef<GameState>) {
  const multipliers = useMultipliers(gameState)
  /**
   * Get resource config by ID
   */
  function getResourceConfig(resourceId: string): ResourceConfig | undefined {
    return resources.find((r) => r.id === resourceId)
  }

  /**
   * Get resource amount by ID
   */
  function getResourceAmount(resourceId: string): number {
    return gameState.value.resources[resourceId]?.current || 0
  }

  /**
   * Check if player can afford a resource cost
   */
  function canAffordResource(resourceId: string, amount: number): boolean {
    return getResourceAmount(resourceId) >= amount
  }

  /**
   * Add resource and track lifetime total
   */
  function addResource(resourceId: string, amount: number): void {
    if (!gameState.value.resources[resourceId]) {
      gameState.value.resources[resourceId] = { current: 0, lifetime: 0 }
    }

    const resourceConfig = getResourceConfig(resourceId)
    const currentAmount = gameState.value.resources[resourceId].current
    let newAmount = currentAmount + amount

    // Apply maxValue bounds if defined (including capacity modifications)
    if (resourceConfig?.maxValue !== undefined) {
      const capacityModification = multipliers.getResourceCapacityModification(resourceId)
      const effectiveMaxValue = resourceConfig.maxValue + capacityModification
      newAmount = Math.min(newAmount, Math.max(0, effectiveMaxValue))
    }

    // Ensure non-negative values for non-depletable resources
    if (resourceConfig && !resourceConfig.isDepletable && newAmount < 0) {
      newAmount = 0
    }

    gameState.value.resources[resourceId].current = newAmount
    gameState.value.resources[resourceId].lifetime += Math.max(0, amount)
  }

  /**
   * Spend resource if available
   */
  function spendResource(resourceId: string, amount: number): boolean {
    const currentAmount = getResourceAmount(resourceId)
    if (currentAmount >= amount) {
      gameState.value.resources[resourceId].current = currentAmount - amount
      return true
    }
    return false
  }

  /**
   * Get production rate for a specific resource (includes production, consumption, and decay)
   */
  function getResourceProductionRate(
    resourceId: string,
    resourceProduction: Map<string, number>,
  ): number {
    let netRate = resourceProduction.get(resourceId) || 0

    // Add natural decay for depletable resources
    const resourceConfig = getResourceConfig(resourceId)
    if (resourceConfig && resourceConfig.isDepletable && resourceConfig.decayRate) {
      const currentAmount = getResourceAmount(resourceId)
      const decayMultiplier = multipliers.getDecayRateMultiplier(resourceId)
      const decayRate = currentAmount * resourceConfig.decayRate * decayMultiplier
      netRate -= decayRate
    }

    return netRate
  }

  /**
   * Apply resource decay for depletable resources
   */
  function applyResourceDecay(): void {
    for (const resourceConfig of resources) {
      if (resourceConfig.isDepletable && resourceConfig.decayRate) {
        const currentAmount = getResourceAmount(resourceConfig.id)
        if (currentAmount > 0) {
          const decayMultiplier = multipliers.getDecayRateMultiplier(resourceConfig.id)
          const decayAmount = currentAmount * resourceConfig.decayRate * decayMultiplier
          gameState.value.resources[resourceConfig.id].current = Math.max(
            0,
            currentAmount - decayAmount,
          )
        }
      }
    }
  }

  /**
   * Apply global upgrade multipliers to resource production
   */
  function applyGlobalMultipliers(resourceChanges: Map<string, number>): Map<string, number> {
    const multipliedChanges = new Map<string, number>()

    // Apply prestige multiplier
    const prestigeMultiplier = Math.pow(1.25, gameState.value.prestige.level)

    // Apply multipliers to production (positive values only, negative values are consumption)
    for (const [resourceId, change] of resourceChanges) {
      if (change > 0) {
        let totalMultiplier = prestigeMultiplier

        // Apply resource-specific global multiplier
        totalMultiplier *= multipliers.getGlobalResourceMultiplier(resourceId)

        multipliedChanges.set(resourceId, change * totalMultiplier)
      } else {
        multipliedChanges.set(resourceId, change) // Don't multiply consumption
      }
    }

    return multipliedChanges
  }

  /**
   * Apply resource production from all generators for one tick
   */
  function applyResourceProduction(resourceProduction: Map<string, number>): void {
    const finalProduction = applyGlobalMultipliers(resourceProduction)

    // Apply the production changes (scaled for tick rate)
    const tickMultiplier = GAME_CONSTANTS.TICK_RATE / 1000

    for (const [resourceId, change] of finalProduction) {
      const changeThisTick = change * tickMultiplier
      if (changeThisTick !== 0) {
        addResource(resourceId, changeThisTick)
      }
    }
  }

  /**
   * Check if resource unlock conditions are met
   */
  function checkResourceUnlocked(resourceId: string): boolean {
    const resourceConfig = getResourceConfig(resourceId)
    if (!resourceConfig || !resourceConfig.unlockConditions) return true

    const result = UnlockSystem.checkConditions(resourceConfig.unlockConditions, gameState.value)
    return result.isUnlocked
  }

  return {
    // Core resource functions
    getResourceConfig,
    getResourceAmount,
    addResource,
    spendResource,
    canAffordResource,

    // Resource production and decay
    getResourceProductionRate,
    applyResourceDecay,
    applyGlobalMultipliers,
    applyResourceProduction,

    // Resource unlocks
    checkResourceUnlocked,
  }
}
