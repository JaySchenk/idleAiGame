import { createPinia, setActivePinia } from 'pinia'
import { createApp } from 'vue'
import type { App } from 'vue'

/**
 * Test utilities for Hollow Content Empire idle game
 */

/**
 * Creates a fresh Pinia instance for testing
 */
export function createTestPinia() {
  const app = createApp({})
  const pinia = createPinia()
  app.use(pinia)
  setActivePinia(pinia)
  return pinia
}

/**
 * Helper to wait for Vue reactivity updates
 */
export async function nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Helper to advance time in tests
 */
export function advanceTime(ms: number) {
  vi.advanceTimersByTime(ms)
}

/**
 * Helper to create a mock game state for testing
 */
export interface MockGameState {
  contentUnits: number
  lifetimeContentUnits: number
  prestigeLevel: number
  generators: Array<{
    id: string
    owned: number
    baseCost: number
    baseProduction: number
    growthRate: number
  }>
  upgrades: Array<{
    id: string
    isPurchased: boolean
    cost: number
    effectType: string
    effectValue: number
  }>
}

/**
 * Creates a basic game state for testing
 */
export function createMockGameState(overrides: Partial<MockGameState> = {}): MockGameState {
  return {
    contentUnits: 100,
    lifetimeContentUnits: 100,
    prestigeLevel: 0,
    generators: [
      {
        id: 'mindless-ad-bot-farm',
        owned: 0,
        baseCost: 10,
        baseProduction: 1,
        growthRate: 1.15,
      },
    ],
    upgrades: [
      {
        id: 'soul-crushing-automation',
        isPurchased: false,
        cost: 100,
        effectType: 'production_multiplier',
        effectValue: 2,
      },
    ],
    ...overrides,
  }
}

/**
 * Helper to simulate game progression scenarios
 */
export class GameProgressionHelper {
  static simulateEarlyGame(): MockGameState {
    return createMockGameState({
      contentUnits: 50,
      lifetimeContentUnits: 150,
      generators: [
        {
          id: 'mindless-ad-bot-farm',
          owned: 3,
          baseCost: 10,
          baseProduction: 1,
          growthRate: 1.15,
        },
      ],
    })
  }

  static simulateMidGame(): MockGameState {
    return createMockGameState({
      contentUnits: 5000,
      lifetimeContentUnits: 25000,
      generators: [
        {
          id: 'mindless-ad-bot-farm',
          owned: 15,
          baseCost: 10,
          baseProduction: 1,
          growthRate: 1.15,
        },
      ],
      upgrades: [
        {
          id: 'soul-crushing-automation',
          isPurchased: true,
          cost: 100,
          effectType: 'production_multiplier',
          effectValue: 2,
        },
      ],
    })
  }

  static simulatePrestigeReady(): MockGameState {
    return createMockGameState({
      contentUnits: 1000,
      lifetimeContentUnits: 50000,
      generators: [
        {
          id: 'mindless-ad-bot-farm',
          owned: 25,
          baseCost: 10,
          baseProduction: 1,
          growthRate: 1.15,
        },
      ],
      upgrades: [
        {
          id: 'soul-crushing-automation',
          isPurchased: true,
          cost: 100,
          effectType: 'production_multiplier',
          effectValue: 2,
        },
      ],
    })
  }
}

/**
 * Mathematical test helpers for validating game calculations
 */
export class MathTestHelpers {
  /**
   * Tests exponential cost calculation accuracy
   */
  static calculateExpectedCost(baseCost: number, growthRate: number, owned: number): number {
    return Math.floor(baseCost * Math.pow(growthRate, owned))
  }

  /**
   * Tests prestige multiplier calculation
   */
  static calculatePrestigeMultiplier(level: number): number {
    return Math.pow(1.25, level)
  }

  /**
   * Tests prestige threshold calculation
   */
  static calculatePrestigeThreshold(level: number): number {
    return 1000 * Math.pow(10, level)
  }

  /**
   * Validates number formatting edge cases
   */
  static getFormattingTestCases(): Array<{ input: number; expected: string }> {
    return [
      { input: 0, expected: '0.00 HCU' },
      { input: 1, expected: '1.00 HCU' },
      { input: 999, expected: '999.00 HCU' },
      { input: 1000, expected: '1.00K HCU' },
      { input: 1000000, expected: '1.00M HCU' },
      { input: 1000000000, expected: '1.00B HCU' },
      { input: 1000000000000, expected: '1.00T HCU' },
      { input: 1000000000000000, expected: '1.00Q HCU' },
      { input: 1e18, expected: '1.00e+18 HCU' },
    ]
  }
}

/**
 * Component test helpers
 */
export class ComponentTestHelpers {
  /**
   * Helper to simulate user clicks
   */
  static async simulateClick(wrapper: any, selector?: string) {
    const element = selector ? wrapper.find(selector) : wrapper
    await element.trigger('click')
    await nextTick()
  }

  /**
   * Helper to check if element is disabled
   */
  static isDisabled(wrapper: any, selector?: string): boolean {
    const element = selector ? wrapper.find(selector) : wrapper
    return element.element.disabled || element.classes().includes('disabled')
  }

  /**
   * Helper to get text content
   */
  static getText(wrapper: any, selector?: string): string {
    const element = selector ? wrapper.find(selector) : wrapper
    return element.text()
  }
}
