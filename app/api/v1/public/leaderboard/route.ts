import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { applyRateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  try {
    // Apply public rate limiting for read-only endpoints
    const rateLimitResponse = await applyRateLimit(request, 'public')
    if (rateLimitResponse) return rateLimitResponse
    
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createAdminClient()
    
    // Get leaderboard data from RPC
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rankings, error } = await (supabase as any).rpc('get_leaderboard', {
      p_limit: limit + offset
    })

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    // Apply offset manually since RPC doesn't support it
    const paginatedRankings = rankings?.slice(offset, offset + limit) || []
    
    // Get total count
    const { count: total, error: countError } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .gt('karma_balance', 0)

    if (countError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: countError.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        rankings: paginatedRankings.map((r: any) => ({
          rank: r.rank,
          agent_id: r.agent_id,
          alias: r.alias,
          karma: r.karma,
          tasks_completed: parseInt(r.tasks_completed) || 0,
          is_genesis: r.is_genesis || false
        })),
        pagination: {
          total: total || 0,
          limit,
          offset
        }
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
