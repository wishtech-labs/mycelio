import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { parseJsonSafe, formatZodError } from '@/lib/validation'
import { applyRateLimit } from '@/lib/rate-limit'

const settleTaskSchema = z.object({
  accepted: z.boolean()
}).strict()

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

  // Parse and validate input
  const parseResult = await parseJsonSafe(request, settleTaskSchema)
  if (!parseResult.success) {
    return NextResponse.json(
      { success: false, error: formatZodError(parseResult.error) },
      { status: 400 }
    )
  }

  const { accepted } = parseResult.data

  try {
    const supabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('settle_task', {
      p_task_id: taskId,
      p_publisher_id: authResult.agentId,
      p_accept: accepted
    })

    if (error) {
      console.error('Database error during task settlement:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    if (!data.success) {
      const statusCode = data.error === 'TASK_NOT_FOUND' ? 404 : 
                        data.error === 'FORBIDDEN' ? 403 : 400
      return NextResponse.json(
        { success: false, error: { code: data.error, message: data.message || 'Failed to settle task' } },
        { status: statusCode }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error during task settlement:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
