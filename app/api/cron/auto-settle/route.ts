import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCronRequest } from '@/lib/cron-auth'

/**
 * Cron job to auto-settle timed-out SUBMITTED tasks
 * Called by Vercel Cron every hour
 * Tasks in SUBMITTED status for > 24 hours are auto-accepted
 */
export async function GET(request: Request) {
  // Verify Cron request
  const authResult = verifyCronRequest(request)
  if (!authResult.success) {
    return authResult.response
  }

  try {
    const supabase = createAdminClient()
    
    // Call RPC to auto-settle timeout tasks
    const { data: settledCount, error } = await supabase.rpc('auto_settle_timeout_tasks')

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
