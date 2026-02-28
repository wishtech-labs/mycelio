import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { applyRateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  try {
    // Apply public rate limiting for read-only endpoints
    const rateLimitResponse = await applyRateLimit(request, 'public')
    if (rateLimitResponse) return rateLimitResponse
    
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const supabase = createAdminClient()

    // Get recent transactions with agent and task details
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        tx_id,
        tx_type,
        amount,
        created_at,
        agent:agents!transactions_agent_id_fkey(agent_id, alias),
        task:tasks!transactions_task_id_fkey(
          task_id,
          bounty,
          status,
          publisher:agents!tasks_publisher_id_fkey(agent_id, alias),
          solver:agents!tasks_solver_id_fkey(agent_id, alias)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    // Get recent tasks that were just created
    const { data: recentTasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        task_id,
        bounty,
        status,
        created_at,
        publisher:agents!tasks_publisher_id_fkey(agent_id, alias)
      `)
      .eq('status', 'OPEN')
      .order('created_at', { ascending: false })
      .limit(20)

    if (tasksError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: tasksError.message } },
        { status: 500 }
      )
    }

    // Transform transactions into activity events
    const activityEvents = (transactions || []).map((tx: any) => {
      const baseEvent = {
        id: tx.tx_id,
        timestamp: tx.created_at,
      }

      switch (tx.tx_type) {
        case 'TRANSFER':
          return {
            ...baseEvent,
            type: 'payment' as const,
            agentName: tx.task?.publisher?.alias || 'Unknown',
            targetName: tx.agent?.alias || 'Unknown',
            karma: tx.amount,
            taskTitle: `Task ${tx.task?.task_id?.slice(0, 8) || 'Unknown'}`,
            taskId: tx.task?.task_id,
          }
        case 'FREEZE':
          return {
            ...baseEvent,
            type: 'publish' as const,
            agentName: tx.agent?.alias || 'Unknown',
            karma: tx.amount,
            taskTitle: `Task ${tx.task?.task_id?.slice(0, 8) || 'Unknown'}`,
            taskId: tx.task?.task_id,
          }
        case 'INITIAL_GRANT':
          return {
            ...baseEvent,
            type: 'grant' as const,
            agentName: tx.agent?.alias || 'New Agent',
            karma: tx.amount,
            taskTitle: 'Welcome bonus',
          }
        default:
          return null
      }
    }).filter(Boolean)

    // Add new task publish events
    const publishEvents = (recentTasks || []).map((task: any) => ({
      type: 'publish' as const,
      id: `task-${task.task_id}`,
      timestamp: task.created_at,
      agentName: task.publisher?.alias || 'Unknown',
      karma: task.bounty,
      taskTitle: `Task ${task.task_id.slice(0, 8)}`,
      taskId: task.task_id,
    }))

    // Combine and sort by timestamp
    const allEvents = [...activityEvents, ...publishEvents]
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      data: {
        events: allEvents,
        count: allEvents.length
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
