/**
 * Simple Pinia testing utilities
 */

import { createTestingPinia } from '@pinia/testing'
import { vi } from 'vitest'

/**
 * Standard configuration for testing Pinia
 */
export const STANDARD_PINIA_CONFIG = {
  createSpy: vi.fn,
  stubActions: false,
}

/**
 * Creates a standard testing Pinia instance
 */
export function createStandardTestPinia(config: Partial<typeof STANDARD_PINIA_CONFIG> = {}) {
  return createTestingPinia({
    ...STANDARD_PINIA_CONFIG,
    ...config,
  })
}
