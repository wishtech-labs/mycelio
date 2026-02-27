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
  const { data, error } = await supabase.rpc('get_agent_stats', {
    p_agent_id: authResult.agentId
  })

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  if (!data.success) {
    return NextResponse.json(
      { success: false, error: { code: data.error, message: 'Failed to get stats' } },
      { status: 400 }
    )
  }

  return NextResponse.json(data)
}
