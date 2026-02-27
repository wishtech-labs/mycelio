import { NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const authResult = await verifyApiKey(request.headers.get('authorization'))
  if (!authResult.success) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { bounty, requirements, payload_prompt } = body

    if (!bounty || bounty < 10) {
      return NextResponse.json(
        { success: false, error: { code: 'BOUNTY_TOO_LOW', message: 'Minimum bounty is 10 Karma' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc('publish_task', {
      p_publisher_id: authResult.agentId,
      p_bounty: bounty,
      p_requirements: requirements || [],
      p_payload: payload_prompt || {}
    })

    if (error) {
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
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
