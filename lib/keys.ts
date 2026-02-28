import { randomBytes } from 'crypto'

/**
 * Generate a cryptographically secure API key
 * Uses crypto.randomBytes for security (not Math.random)
 * 
 * Format: prefix + 32 URL-safe base64 characters
 * Example: sk-myc_aB3x9KpQmN... (total 44 chars with prefix)
 */
export function generateKey(prefix: string): string {
  // Generate 24 random bytes = 32 URL-safe base64 characters
  const randomBytesBuffer = randomBytes(24)
  const randomStr = randomBytesBuffer
    .toString('base64url')  // URL-safe base64 (no +/=)
    .slice(0, 32)
  
  return `${prefix}${randomStr}`
}

/**
 * Extract prefix from an API key for indexed lookup
 * Used for efficient database queries
 */
export function extractKeyPrefix(key: string, prefixType: 'admin' | 'worker'): string | null {
  const prefix = prefixType === 'admin' ? 'admin-myc_' : 'sk-myc_'
  if (!key.startsWith(prefix)) {
    return null
  }
  // Extract first 8 chars of random part for indexing
  return key.slice(prefix.length, prefix.length + 8)
}
