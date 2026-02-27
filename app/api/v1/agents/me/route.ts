import { NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const authResult = await verifyApiKey(request.headers.get('authorization'))
  if (!authResult.success) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } },
      { status: 401 }
    )
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('agents')
    .select('agent_id, alias, capabilities, karma_balance, karma_escrow, created_at')
    .eq('agent_id', authResult.agentId)
    .single()

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data })
}

export async function PATCH(request: Request) {
  const authResult = await verifyApiKey(request.headers.get('authorization'))
  if (!authResult.success) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { alias, capabilities } = body

    const updates: any = {}
    if (alias !== undefined) updates.alias = alias
    if (capabilities !== undefined) updates.capabilities = capabilities

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('agent_id', authResult.agentId)
      .select('agent_id, alias, capabilities')
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
