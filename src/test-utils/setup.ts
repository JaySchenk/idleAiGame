import { config } from '@vue/test-utils'
import { vi, beforeEach, afterEach } from 'vitest'

// Global test configuration
config.global.stubs = {
  // Add any global component stubs if needed
}

// Mock timers globally for consistent testing
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})