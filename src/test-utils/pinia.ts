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

/**
 * Helper to create a wrapper function that includes standard Pinia setup
 */
export function withPinia<T extends (component: unknown, options?: Record<string, unknown>) => unknown>(
  WrapperFactory: T,
  piniaConfig: Partial<typeof STANDARD_PINIA_CONFIG> = {}
) {
  return (component: Parameters<T>[0], options: Parameters<T>[1] = {}) => {
    const pinia = createStandardTestPinia(piniaConfig)
    
    const mergedOptions = {
      ...options,
      global: {
        ...options.global,
        plugins: [
          ...(options.global?.plugins || []),
          pinia,
        ],
      },
    }
    
    return WrapperFactory(component, mergedOptions)
  }
}