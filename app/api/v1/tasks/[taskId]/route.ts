import { NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  const authResult = await verifyApiKey(request.headers.get('authorization'))
  if (!authResult.success) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } },
      { status: 401 }
    )
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('task_id, publisher_id, solver_id, bounty, status, requirements, payload_prompt, created_at, timeout_at')
    .eq('task_id', params.taskId)
    .single()

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data })
}
