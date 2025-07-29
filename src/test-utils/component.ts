/**
 * Simple component testing utilities
 */

import { mount } from '@vue/test-utils'
import { createStandardTestPinia } from './pinia'

/**
 * Mount a component with standard Pinia setup
 */
export function mountWithPinia(component: unknown, options: Record<string, unknown> = {}) {
  const pinia = createStandardTestPinia()

  const mergedOptions = {
    ...options,
    global: {
      ...options.global,
      plugins: [...(options.global?.plugins || []), pinia],
    },
  }

  return mount(component, mergedOptions)
}
