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
      testTimeout: 10000,
      hookTimeout: 10000,
      teardownTimeout: 5000,
      setupFiles: ['./src/test-utils/setup.ts'],
    },
  }),
)
