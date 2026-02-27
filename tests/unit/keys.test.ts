import { describe, it, expect } from 'vitest'
import { generateKey } from '@/lib/keys'

describe('Key Generation', () => {
  it('should generate keys with correct prefix', () => {
    const adminKey = generateKey('admin-myc_')
    const workerKey = generateKey('sk-myc_')

    expect(adminKey).toStartWith('admin-myc_')
    expect(workerKey).toStartWith('sk-myc_')
  })

  it('should generate unique keys', () => {
    const key1 = generateKey('sk-myc_')
    const key2 = generateKey('sk-myc_')

    expect(key1).not.toBe(key2)
  })

  it('should generate keys of correct length', () => {
    const key = generateKey('sk-myc_')
    // prefix (7) + 32 random chars = 39 chars
    expect(key.length).toBe(39)
  })

  it('should only contain valid characters', () => {
    const key = generateKey('sk-myc_')
    const validChars = /^[a-zA-Z0-9_]+$/
    
    expect(key).toMatch(validChars)
  })
})
