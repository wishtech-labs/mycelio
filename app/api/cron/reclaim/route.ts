import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Cron job to reclaim timed-out LOCKED tasks
 * Called by Vercel Cron every 30 seconds
 */
export async function GET(request: Request) {
  // Verify Cron Secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    )
  }

  try {
    const supabase = createAdminClient()
    
    // Call RPC to reclaim timeout tasks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reclaimedCount, error } = await (supabase as any).rpc('reclaim_timeout_tasks')

    if (error) {
      console.error('Failed to reclaim timeout tasks:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    console.log(`[${new Date().toISOString()}] Reclaimed ${reclaimedCount} timeout tasks`)

    return NextResponse.json({
      success: true,
      data: {
        reclaimed_count: reclaimedCount || 0,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
