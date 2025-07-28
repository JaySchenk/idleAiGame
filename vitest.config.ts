import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      testTimeout: 10000, // 10 second timeout for all tests
      hookTimeout: 10000, // 10 second timeout for hooks
      teardownTimeout: 5000, // 5 second timeout for teardown
    },
  }),
)
