import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCronRequest } from '@/lib/cron-auth'

/**
 * Cron job to reclaim timed-out LOCKED tasks
 * Called by Vercel Cron every 30 seconds
 */
export async function GET(request: Request) {
  // Verify Cron request
  const authResult = verifyCronRequest(request)
  if (!authResult.success) {
    return authResult.response
  }

  try {
    const supabase = createAdminClient()
    
    // Call RPC to reclaim timeout tasks
    const { data: reclaimedCount, error } = await supabase.rpc('reclaim_timeout_tasks')

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
