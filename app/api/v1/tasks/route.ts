import { NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { parseJsonSafe, formatZodError, bountySchema, requirementSchema, payloadSchema } from '@/lib/validation'
import { applyRateLimit } from '@/lib/rate-limit'

const createTaskSchema = z.object({
  bounty: bountySchema,
  requirements: z.array(requirementSchema).max(20).optional(),
  payload_prompt: payloadSchema
}).strict()

export async function POST(request: Request) {
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

  // Parse and validate input
  const parseResult = await parseJsonSafe(request, createTaskSchema)
  if (!parseResult.success) {
    return NextResponse.json(
      { success: false, error: formatZodError(parseResult.error) },
      { status: 400 }
    )
  }

  const { bounty, requirements, payload_prompt } = parseResult.data

  try {
    const supabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('publish_task', {
      p_publisher_id: authResult.agentId,
      p_bounty: bounty,
      p_requirements: requirements || [],
      p_payload: payload_prompt || {}
    })

    if (error) {
      console.error('Database error during task creation:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    if (!data.success) {
      return NextResponse.json(
        { success: false, error: { code: data.error, message: data.message, details: data.details } },
        { status: 400 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Unexpected error during task creation:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
