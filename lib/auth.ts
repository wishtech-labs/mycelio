import { createAdminClient } from './supabase/admin'
import bcrypt from 'bcryptjs'
import { extractKeyPrefix } from './keys'

export interface AuthResult {
  success: boolean
  agentId?: string
  keyType?: 'admin' | 'worker'
  error?: string
}

/**
 * Verify API key with optimized prefix-based lookup
 * Uses indexed prefix query for O(1) performance instead of O(n) scan
 */
export async function verifyApiKey(authHeader: string | null): Promise<AuthResult> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { success: false, error: 'UNAUTHORIZED' }
  }

  const key = authHeader.slice(7)
  
  // Determine key type
  let keyType: 'admin' | 'worker'
  if (key.startsWith('admin-myc_')) {
    keyType = 'admin'
  } else if (key.startsWith('sk-myc_')) {
    keyType = 'worker'
  } else {
    return { success: false, error: 'UNAUTHORIZED' }
  }

  // Extract prefix for efficient lookup
  const keyPrefix = extractKeyPrefix(key, keyType)
  if (!keyPrefix) {
    return { success: false, error: 'UNAUTHORIZED' }
  }

  const supabase = createAdminClient()
  
  // Use indexed prefix query for O(1) lookup
  // This avoids loading all agents into memory
  const hashField = keyType === 'admin' ? 'admin_key_hash' : 'worker_key_hash'
  const prefixField = keyType === 'admin' ? 'admin_key_prefix' : 'worker_key_prefix'
  
  const { data: agents, error } = await supabase
    .from('agents')
    .select(`agent_id, ${hashField}`)
    .eq(prefixField, keyPrefix)
    .limit(5)  // Small limit since prefix collisions are unlikely

  if (error || !agents || agents.length === 0) {
    // Use constant-time comparison to prevent timing attacks
    // even when no agent is found
    // Using $2a$12$ prefix to match production bcrypt cost factor (12 rounds)
    await bcrypt.compare(key, '$2a$12$dummy.hash.for.timing.attack.prevention.xxxxxxxxxxxxxxxxxxxxxxxxxx')
    return { success: false, error: 'UNAUTHORIZED' }
  }

  // Parallel bcrypt comparison with early exit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = await Promise.all(
    (agents as any[]).map(async (agent) => ({
      agentId: agent.agent_id as string,
      valid: await bcrypt.compare(key, agent[hashField] as string)
    }))
  )

  const match = results.find(r => r.valid)
  
  if (match) {
    return { 
      success: true, 
      agentId: match.agentId,
      keyType
    }
  }

  return { success: false, error: 'UNAUTHORIZED' }
}

/**
 * Verify admin key specifically
 * Returns 403 if key is valid but not an admin key
 */
export async function verifyAdminKey(authHeader: string | null): Promise<AuthResult> {
  const result = await verifyApiKey(authHeader)
  
  if (!result.success) {
    return result
  }
  
  if (result.keyType !== 'admin') {
    return { success: false, error: 'FORBIDDEN' }
  }
  
  return result
}
