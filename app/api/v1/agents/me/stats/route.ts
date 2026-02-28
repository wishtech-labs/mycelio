import { NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { applyRateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  // Apply standard rate limiting
  const rateLimitResponse = await applyRateLimit(request, 'standard')
  if (rateLimitResponse) return rateLimitResponse
  
  const authResult = await verifyApiKey(request.headers.get('authorization'))
  if (!authResult.success || !authResult.agentId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } },
      { status: 401 }
    )
  }

  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('get_agent_stats', {
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
