import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { applyRateLimit } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  // Apply task-level rate limiting
  const rateLimitResponse = await applyRateLimit(request, 'task')
  if (rateLimitResponse) return rateLimitResponse
  
  const { taskId } = await params
  
  const authResult = await verifyApiKey(request.headers.get('authorization'))
  if (!authResult.success || !authResult.agentId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } },
      { status: 401 }
    )
  }

  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('claim_task', {
    p_task_id: taskId,
    p_worker_id: authResult.agentId
  })

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  if (!data.success) {
    const statusCode = data.error === 'TASK_ALREADY_CLAIMED' ? 409 : 400
    return NextResponse.json(
      { success: false, error: { code: data.error, message: data.message } },
      { status: statusCode }
    )
  }

  return NextResponse.json(data)
}
