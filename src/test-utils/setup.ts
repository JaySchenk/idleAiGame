import { config } from '@vue/test-utils'
import { vi, beforeEach, afterEach } from 'vitest'
import { getAllComponentMocks } from '../__mocks__/components'

// Global test configuration with common component stubs
config.global.stubs = {
  ...getAllComponentMocks(),
  // Add any additional global component stubs if needed
}

// Global plugins that should be available in all tests
config.global.plugins = []

// Mock common browser APIs globally
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
  },
  writable: true,
})

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// Mock timers globally for consistent testing
beforeEach(() => {
  vi.useFakeTimers()
  // Reset localStorage/sessionStorage mocks
  vi.mocked(window.localStorage.getItem).mockClear()
  vi.mocked(window.localStorage.setItem).mockClear()
  vi.mocked(window.localStorage.removeItem).mockClear()
  vi.mocked(window.localStorage.clear).mockClear()
  vi.mocked(window.sessionStorage.getItem).mockClear()
  vi.mocked(window.sessionStorage.setItem).mockClear()
  vi.mocked(window.sessionStorage.removeItem).mockClear()
  vi.mocked(window.sessionStorage.clear).mockClear()
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
  vi.clearAllTimers()
})