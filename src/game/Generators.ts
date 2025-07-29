import type { GeneratorConfig } from '../config/generators'
import type { GameState } from '../stores/gameStore'

/**
 * Calculate net resource production from all generators
 * Returns a map of resource changes per second
 */
export function calculateResourceProduction(
  gameState: GameState,
  getGeneratorMultiplier: (id: string) => number,
): Map<string, number> {
  const resourceChanges = new Map<string, number>()

  // Process each generator
  for (const generator of gameState.generators) {
    if (generator.owned === 0) continue

    const generatorMultiplier = getGeneratorMultiplier(generator.id)
    const generatorCount = generator.owned

    // Check if generator can operate (has enough input resources)
    const canOperate = checkGeneratorInputs(generator, gameState, generatorCount)
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
function checkGeneratorInputs(
  generator: GeneratorConfig,
  gameState: GameState,
  generatorCount: number,
): boolean {
  for (const input of generator.inputs) {
    const resourceState = gameState.resources[input.resourceId]
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
 * Apply global upgrade multipliers to resource production
 */
export function applyGlobalMultipliers(
  resourceChanges: Map<string, number>,
  gameState: GameState,
  getGlobalResourceMultiplier?: (resourceId: string) => number,
): Map<string, number> {
  const multipliedChanges = new Map<string, number>()

  // Apply prestige multiplier
  const prestigeMultiplier = Math.pow(1.25, gameState.prestige.level)

  // Apply multipliers to production (positive values only, negative values are consumption)
  for (const [resourceId, change] of resourceChanges) {
    if (change > 0) {
      let totalMultiplier = prestigeMultiplier
      
      // Apply resource-specific global multiplier if function provided
      if (getGlobalResourceMultiplier) {
        totalMultiplier *= getGlobalResourceMultiplier(resourceId)
      }
      
      multipliedChanges.set(resourceId, change * totalMultiplier)
    } else {
      multipliedChanges.set(resourceId, change) // Don't multiply consumption
    }
  }

  return multipliedChanges
}

/**
 * Get total HCU production rate (for backward compatibility)
 */
export function getHCUProductionRate(
  gameState: GameState,
  getGeneratorMultiplier: (id: string) => number,
  getGlobalResourceMultiplier?: (resourceId: string) => number,
): number {
  const resourceChanges = calculateResourceProduction(gameState, getGeneratorMultiplier)
  const globalChanges = applyGlobalMultipliers(resourceChanges, gameState, getGlobalResourceMultiplier)

  return globalChanges.get('hcu') || 0
}
