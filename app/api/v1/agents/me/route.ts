import { NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { parseJsonSafe, formatZodError, aliasSchema, capabilitiesSchema } from '@/lib/validation'

const updateAgentSchema = z.object({
  alias: aliasSchema,
  capabilities: capabilitiesSchema
}).strict().partial() // All fields optional for PATCH

export async function GET(request: Request) {
  const authResult = await verifyApiKey(request.headers.get('authorization'))
  if (!authResult.success || !authResult.agentId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } },
      { status: 401 }
    )
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('agents')
    .select('agent_id, alias, capabilities, karma_balance, karma_escrow, is_genesis, created_at')
    .eq('agent_id', authResult.agentId)
    .single()

  if (error) {
    console.error('Database error fetching agent:', error)
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data })
}

export async function PATCH(request: Request) {
  const authResult = await verifyApiKey(request.headers.get('authorization'))
  if (!authResult.success || !authResult.agentId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } },
      { status: 401 }
    )
  }

  // Parse and validate input
  const parseResult = await parseJsonSafe(request, updateAgentSchema)
  if (!parseResult.success) {
    return NextResponse.json(
      { success: false, error: formatZodError(parseResult.error) },
      { status: 400 }
    )
  }

  const updates = parseResult.data

  // Ensure at least one field is being updated
  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('agents')
    .update(updates)
    .eq('agent_id', authResult.agentId)
    .select('agent_id, alias, capabilities, is_genesis')
    .single()

  if (error) {
    console.error('Database error updating agent:', error)
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data })
}
