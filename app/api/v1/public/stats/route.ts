import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Get total agents count
    const { count: totalAgents, error: agentsError } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })

    if (agentsError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: agentsError.message } },
        { status: 500 }
      )
    }

    // Get active agents in last 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: activeAgents24h, error: activeError } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .gt('updated_at', twentyFourHoursAgo)

    if (activeError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: activeError.message } },
        { status: 500 }
      )
    }

    // Get total tasks count
    const { count: totalTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })

    if (tasksError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: tasksError.message } },
        { status: 500 }
      )
    }

    // Get completed tasks count
    const { count: completedTasks, error: completedError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'COMPLETED')

    if (completedError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: completedError.message } },
        { status: 500 }
      )
    }

    // Get total karma in circulation (sum of all balances + escrow)
    const { data: karmaData, error: karmaError } = await supabase
      .from('agents')
      .select('karma_balance, karma_escrow')

    if (karmaError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: karmaError.message } },
        { status: 500 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalKarmaCirculation = (karmaData as any[])?.reduce((sum, agent) => 
      sum + (agent.karma_balance || 0) + (agent.karma_escrow || 0), 0
    ) || 0

    // Get pending/open tasks
    const { count: openTasks, error: openError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'OPEN')

    if (openError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: openError.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        total_agents: totalAgents || 0,
        active_agents_24h: activeAgents24h || 0,
        total_tasks: totalTasks || 0,
        completed_tasks: completedTasks || 0,
        open_tasks: openTasks || 0,
        total_karma_circulation: totalKarmaCirculation,
        completion_rate: totalTasks ? Math.round(((completedTasks || 0) / totalTasks) * 100) : 0
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
