import { createPinia, setActivePinia } from 'pinia'
import { createApp } from 'vue'
import { vi } from 'vitest'
import { HCU } from '../config/currencies'

/**
 * Integration test utilities that use real composables with programmatic control
 * This allows integration tests to precisely control game loop execution
 */

/**
 * Creates a Pinia instance for integration tests without mocking composables
 */
export function createIntegrationTestPinia() {
  const app = createApp({})
  const pinia = createPinia()
  app.use(pinia)
  setActivePinia(pinia)
  return pinia
}

/**
 * Programmatically runs the game loop for a specified number of ticks
 * @param gameStore - Game store instance
 * @param ticks - Number of game loop ticks to execute
 */
export function runGameLoopTicks(gameStore: any, ticks: number) {
  gameStore.advanceGameLoop(ticks)
  vi.advanceTimersByTime(gameStore.tickRate * ticks)
}

/**
 * Runs the game loop until a condition is met or max ticks reached
 * @param gameStore - Game store instance
 * @param condition - Function that returns true when the condition is met
 * @param maxTicks - Maximum number of ticks to prevent infinite loops
 */
export function runGameLoopUntil(
  gameStore: any,
  condition: () => boolean,
  maxTicks: number = 10000,
): number {
  let ticks = 0

  while (!condition() && ticks < maxTicks) {
    runGameLoopTicks(gameStore, 1)
    ticks++
  }

  if (ticks >= maxTicks) {
    throw new Error(
      `runGameLoopUntil exceeded maximum ticks (${maxTicks}). Last state: HCU=${gameStore.getCurrencyAmount(HCU)}, Lifetime=${gameStore.lifetimeCurrencyAmounts[HCU.id]}`,
    )
  }

  return ticks
}

/**
 * Helper to quickly advance the game to accumulate resources
 * @param gameStore - Game store instance
 * @param targetHCU - Target content units to reach
 * @param maxTicks - Maximum ticks to prevent infinite loops
 */
export function progressToHCU(gameStore: any, targetHCU: number, maxTicks: number = 10000): number {
  return runGameLoopUntil(gameStore, () => gameStore.getCurrencyAmount(HCU) >= targetHCU, maxTicks)
}

/**
 * Helper to progress until prestige is available
 * @param gameStore - Game store instance
 * @param maxTicks - Maximum ticks to prevent infinite loops
 */
export function progressToPrestige(gameStore: any, maxTicks: number = 50000): number {
  return runGameLoopUntil(gameStore, () => gameStore.canPrestige, maxTicks)
}

/**
 * Helper to purchase items repeatedly until no longer affordable
 * @param gameStore - Game store instance
 * @param purchaseAction - Function to execute the purchase
 * @param canAffordCheck - Function to check if purchase is affordable
 * @param maxPurchases - Maximum purchases to prevent infinite loops
 */
export function purchaseUntilUnaffordable(
  gameStore: any,
  purchaseAction: () => void,
  canAffordCheck: () => boolean,
  maxPurchases: number = 1000,
): number {
  let purchases = 0

  while (canAffordCheck() && purchases < maxPurchases) {
    purchaseAction()
    purchases++
  }

  return purchases
}

/**
 * Helper to set up a game store with initial resources for testing
 * @param gameStore - Game store instance
 * @param initialHCU - Starting content units
 * @param initialLifetime - Starting lifetime content units
 */
export function setupGameWithResources(
  gameStore: any,
  initialHCU: number = 0,
  initialLifetime: number = 0,
) {
  if (initialHCU > 0) {
    ;((amount: number) => gameStore.addCurrency(HCU, amount))(initialHCU)
  }
  if (initialLifetime > 0) {
    gameStore.lifetimeCurrencyAmounts[HCU.id] = Math.max(
      initialLifetime,
      gameStore.lifetimeCurrencyAmounts[HCU.id],
    )
  }
}
