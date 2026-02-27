import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params
  
  const authResult = await verifyApiKey(request.headers.get('authorization'))
  if (!authResult.success) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { payload_result } = body

    // Validate payload size (max 64KB)
    const payloadSize = JSON.stringify(payload_result).length
    if (payloadSize > 64 * 1024) {
      return NextResponse.json(
        { success: false, error: { code: 'PAYLOAD_TOO_LARGE', message: 'Payload exceeds 64KB limit' } },
        { status: 413 }
      )
    }

    const supabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('submit_task_result', {
      p_task_id: taskId,
      p_solver_id: authResult.agentId,
      p_result: payload_result || {}
    })

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    if (!data.success) {
      const statusCode = data.error === 'TASK_NOT_FOUND' ? 404 : 
                        data.error === 'FORBIDDEN' ? 403 : 400
      return NextResponse.json(
        { success: false, error: { code: data.error, message: data.message } },
        { status: statusCode }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
