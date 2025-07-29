import type { ComputedRef } from 'vue'
import type { GameState } from '../stores/gameStore'
import { type GeneratorConfig, type ResourceCost } from '../config/generators'
import { UnlockSystem } from '../utils/unlockSystem'
import { useMultipliers } from './useMultipliers'

export interface GeneratorResourceCallbacks {
  canAffordResource: (resourceId: string, amount: number) => boolean
  spendResource: (resourceId: string, amount: number) => boolean
}

export function useGenerators(
  gameState: ComputedRef<GameState>,
  callbacks: GeneratorResourceCallbacks,
) {
  const multipliers = useMultipliers(gameState)
  /**
   * Get generator by ID
   */
  function getGenerator(id: string): GeneratorConfig | undefined {
    return gameState.value.generators.find((g) => g.id === id)
  }

  /**
   * Calculate generator cost based on owned count - returns array of resource costs
   */
  function getGeneratorCost(generatorId: string): ResourceCost[] {
    const generator = gameState.value.generators.find((g) => g.id === generatorId)
    if (!generator) return []

    // cost_next = cost_base × (rate_growth)^owned
    return generator.baseCost.map((cost) => ({
      resourceId: cost.resourceId,
      amount: Math.floor(cost.amount * Math.pow(generator.costGrowthRate, generator.owned)),
    }))
  }

  /**
   * Calculate primary resource cost (HCU) for display purposes
   */
  function getGeneratorHCUCost(generatorId: string): number {
    const costs = getGeneratorCost(generatorId)
    const hcuCost = costs.find((cost) => cost.resourceId === 'hcu')
    return hcuCost ? hcuCost.amount : 0
  }

  /**
   * Check if generator unlock conditions are met
   */
  function checkUnlockConditions(generatorId: string): boolean {
    const generator = gameState.value.generators.find((g) => g.id === generatorId)
    if (!generator) return false

    const result = UnlockSystem.checkConditions(generator.unlockConditions || [], gameState.value)
    return result.isUnlocked
  }

  /**
   * Check if player can purchase generator
   */
  function canPurchaseGenerator(generatorId: string): boolean {
    const costs = getGeneratorCost(generatorId)

    // Check if player can afford all resource costs
    for (const cost of costs) {
      if (!callbacks.canAffordResource(cost.resourceId, cost.amount)) {
        return false
      }
    }

    // Check unlock conditions
    return checkUnlockConditions(generatorId)
  }

  /**
   * Purchase a generator
   */
  function purchaseGenerator(generatorId: string): boolean {
    const generator = gameState.value.generators.find((g) => g.id === generatorId)
    if (!generator) return false

    // Check if we can afford all costs and meet unlock conditions
    if (!canPurchaseGenerator(generatorId)) {
      return false
    }

    const costs = getGeneratorCost(generatorId)

    // Spend all required resources
    for (const cost of costs) {
      if (!callbacks.spendResource(cost.resourceId, cost.amount)) {
        // This shouldn't happen if canPurchaseGenerator worked correctly
        return false
      }
    }

    generator.owned++
    return true
  }

  /**
   * Get generator production rate
   */
  function getGeneratorProductionRate(generatorId: string): number {
    const generator = gameState.value.generators.find((g) => g.id === generatorId)
    if (!generator) return 0

    let rate = generator.baseProduction * generator.owned
    rate *= multipliers.getGeneratorMultiplier(generator.id)

    return rate
  }

  /**
   * Calculate net resource production from all generators
   * Returns a map of resource changes per second
   */
  function calculateResourceProduction(): Map<string, number> {
    const resourceChanges = new Map<string, number>()

    // Process each generator
    for (const generator of gameState.value.generators) {
      if (generator.owned === 0) continue

      const generatorMultiplier = multipliers.getGeneratorMultiplier(generator.id)
      const generatorCount = generator.owned

      // Check if generator can operate (has enough input resources)
      const canOperate = checkGeneratorInputs(generator, generatorCount)
      if (!canOperate) continue

      // Calculate effective production rate
      const effectiveRate = generatorCount * generatorMultiplier

      // Apply input consumption
      for (const input of generator.inputs) {
        const currentChange = resourceChanges.get(input.resourceId) || 0
        resourceChanges.set(input.resourceId, currentChange - input.amount * effectiveRate)
      }

      // Apply output production
      for (const output of generator.outputs) {
        const currentChange = resourceChanges.get(output.resourceId) || 0
        resourceChanges.set(output.resourceId, currentChange + output.amount * effectiveRate)
      }
    }

    return resourceChanges
  }

  /**
   * Check if a generator has enough input resources to operate
   */
  function checkGeneratorInputs(generator: GeneratorConfig, generatorCount: number): boolean {
    for (const input of generator.inputs) {
      const resourceState = gameState.value.resources[input.resourceId]
      if (!resourceState) continue

      // Check if we have enough resources for at least one tick (1/10th second)
      const requiredAmount = input.amount * generatorCount * 0.1
      if (resourceState.current < requiredAmount) {
        return false
      }
    }

    return true
  }

  /**
   * Get total HCU production rate (for backward compatibility)
   */
  function getHCUProductionRate(resourceProduction: Map<string, number>): number {
    return resourceProduction.get('hcu') || 0
  }

  /**
   * Reset all generator owned counts
   */
  function resetGenerators(): void {
    for (const generator of gameState.value.generators) {
      generator.owned = 0
    }
  }

  return {
    // Core generator functions
    getGenerator,
    getGeneratorCost,
    getGeneratorHCUCost,
    checkUnlockConditions,
    canPurchaseGenerator,
    purchaseGenerator,
    getGeneratorProductionRate,

    // Resource production calculations
    calculateResourceProduction,
    checkGeneratorInputs,
    getHCUProductionRate,

    // Generator management
    resetGenerators,
  }
}
