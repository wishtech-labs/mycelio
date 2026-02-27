import { expect, beforeAll } from 'vitest'

// Custom matchers
expect.extend({
  toStartWith(received: string, expected: string) {
    const pass = received.startsWith(expected)
    return {
      pass,
      message: () => pass
        ? `expected ${received} not to start with ${expected}`
        : `expected ${received} to start with ${expected}`,
    }
  },
})

// Extend TypeScript types
declare module 'vitest' {
  interface Assertion<T = any> {
    toStartWith(expected: string): T
  }
  interface AsymmetricMatchersContaining {
    toStartWith(expected: string): any
  }
}

// Global test setup
beforeAll(() => {
  // Verify required environment variables
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.warn('⚠️ Missing environment variables:', missing.join(', '))
    console.warn('Tests may fail without proper Supabase configuration')
  }
})
