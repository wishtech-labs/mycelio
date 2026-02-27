import { NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import bcrypt from 'bcryptjs'
import { generateKey } from '@/lib/keys'

export async function POST(request: Request) {
  const authResult = await verifyApiKey(request.headers.get('authorization'))
  if (!authResult.success || authResult.keyType !== 'admin') {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Admin key required' } },
      { status: 403 }
    )
  }

  try {
    const newWorkerKey = generateKey('sk-myc_')
    const workerKeyHash = await bcrypt.hash(newWorkerKey, 10)

    const supabase = createAdminClient()
    
    // Use raw SQL to avoid TypeScript issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('agents')
      .update({ 
        worker_key_hash: workerKeyHash,
        updated_at: new Date().toISOString() 
      })
      .eq('agent_id', authResult.agentId)

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
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
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
