/**
 * Simple component testing utilities
 */

import { mount } from '@vue/test-utils'
import { withPinia } from './pinia'

/**
 * Mount a component with standard Pinia setup
 */
export const mountWithPinia = withPinia(mount)