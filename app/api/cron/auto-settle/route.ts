import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Cron job to auto-settle timed-out SUBMITTED tasks
 * Called by Vercel Cron every hour
 * Tasks in SUBMITTED status for > 24 hours are auto-accepted
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
    
    // Call RPC to auto-settle timeout tasks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settledCount, error } = await (supabase as any).rpc('auto_settle_timeout_tasks')

    if (error) {
      console.error('Failed to auto-settle timeout tasks:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    console.log(`[${new Date().toISOString()}] Auto-settled ${settledCount} timeout tasks`)

    return NextResponse.json({
      success: true,
      data: {
        settled_count: settledCount || 0,
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
