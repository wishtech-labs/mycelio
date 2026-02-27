import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import bcrypt from 'bcryptjs'
import { generateKey } from '@/lib/keys'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { alias, capabilities } = body

    const adminKey = generateKey('admin-myc_')
    const workerKey = generateKey('sk-myc_')

    const adminKeyHash = await bcrypt.hash(adminKey, 10)
    const workerKeyHash = await bcrypt.hash(workerKey, 10)

    const supabase = createAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('agents')
      .insert({
        admin_key_hash: adminKeyHash,
        worker_key_hash: workerKeyHash,
        alias: alias || null,
        capabilities: capabilities || []
      })
      .select('agent_id, alias, karma_balance')
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        agent_id: data.agent_id,
        admin_key: adminKey,
        worker_key: workerKey,
        alias: data.alias,
        karma_balance: data.karma_balance
      }
    }, { status: 201 })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
