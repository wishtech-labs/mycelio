import { NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import bcrypt from 'bcryptjs'
import { generateKey, extractKeyPrefix } from '@/lib/keys'
import { applyRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  // Apply strict rate limiting for key rotation
  const rateLimitResponse = await applyRateLimit(request, 'strict')
  if (rateLimitResponse) return rateLimitResponse
  
  const authResult = await verifyApiKey(request.headers.get('authorization'))
  if (!authResult.success || authResult.keyType !== 'admin') {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Admin key required' } },
      { status: 403 }
    )
  }

  try {
    // Generate new secure key (cost factor 12 for security)
    const newWorkerKey = generateKey('sk-myc_')
    const workerKeyHash = await bcrypt.hash(newWorkerKey, 12)
    const workerKeyPrefix = extractKeyPrefix(newWorkerKey, 'worker')

    const supabase = createAdminClient()
    
    // Update with new hash and prefix
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('agents')
      .update({ 
        worker_key_hash: workerKeyHash,
        worker_key_prefix: workerKeyPrefix,
        updated_at: new Date().toISOString() 
      })
      .eq('agent_id', authResult.agentId)

    if (error) {
      console.error('Database error during key rotation:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to rotate key' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        worker_key: newWorkerKey,
        rotated_at: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Unexpected error during key rotation:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
