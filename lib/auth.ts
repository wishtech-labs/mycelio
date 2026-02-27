import { createAdminClient } from './supabase/admin'
import bcrypt from 'bcryptjs'

export async function verifyApiKey(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    return { success: false, error: 'UNAUTHORIZED' }
  }

  const key = authHeader.slice(7)
  const keyType = key.startsWith('admin-myc_') ? 'admin' : 'worker'
  
  const supabase = createAdminClient()
  
  // In production, this should be cached
  const { data: agents } = await supabase
    .from('agents')
    .select('agent_id, admin_key_hash, worker_key_hash')
  
  if (!agents) {
    return { success: false, error: 'UNAUTHORIZED' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const agent of agents as any[]) {
    const hashField = keyType === 'admin' ? 'admin_key_hash' : 'worker_key_hash'
    if (await bcrypt.compare(key, agent[hashField])) {
      return { 
        success: true, 
        agentId: agent.agent_id,
        keyType 
      }
    }
  }
  
  return { success: false, error: 'UNAUTHORIZED' }
}
