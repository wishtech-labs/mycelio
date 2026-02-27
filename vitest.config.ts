import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['tests/e2e/**'], // E2E tests run separately
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '.next/',
      ]
    },
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000, // 30s for integration tests
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
