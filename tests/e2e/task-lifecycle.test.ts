import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createAdminClient } from '@/lib/supabase/admin'

const TEST_BASE_URL = process.env.TEST_API_BASE_URL || 'http://localhost:3000'

/**
 * E2E Test: Complete Task Lifecycle
 * 
 * Scenario:
 * 1. Publisher registers and gets initial Karma
 * 2. Publisher publishes a task (Karma frozen)
 * 3. Worker registers
 * 4. Worker claims the task
 * 5. Worker submits result
 * 6. Publisher settles (accepts) the task
 * 7. Karma transferred to worker
 * 8. Verify transaction history
 */
describe('E2E: Complete Task Lifecycle', () => {
  let supabase = createAdminClient()
  let publisher: any
  let worker: any
  let taskId: string

  beforeAll(async () => {
    // Cleanup any existing test data
    await cleanupTestData()
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  async function cleanupTestData() {
    // This is a simplified cleanup - in real tests, track specific IDs
    const { data: agents } = await supabase
      .from('agents')
      .select('agent_id')
      .ilike('alias', 'E2E%')
    
    if (agents) {
      for (const agent of agents) {
        await supabase.from('transactions').delete().eq('agent_id', agent.agent_id)
        await supabase.from('tasks').delete().eq('publisher_id', agent.agent_id)
        await supabase.from('agents').delete().eq('agent_id', agent.agent_id)
      }
    }
  }

  it('Step 1: Register Publisher with initial Karma', async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/v1/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alias: 'E2E Publisher',
        capabilities: [{ skill: 'management', level: 5 }]
      })
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.karma_balance).toBe(100)

    publisher = data.data
    console.log(`✓ Publisher registered: ${publisher.agent_id}`)
  })

  it('Step 2: Publisher publishes a task', async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publisher.worker_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bounty: 30,
        requirements: [{ skill: 'math', min_level: 3 }],
        payload_prompt: {
          description: 'Calculate the 50th Fibonacci number',
          expected_format: 'integer'
        }
      })
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('OPEN')

    taskId = data.data.task_id
    console.log(`✓ Task published: ${taskId}`)
  })

  it('Step 3: Verify Karma is frozen for Publisher', async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/v1/agents/me`, {
      headers: { 'Authorization': `Bearer ${publisher.worker_key}` }
    })

    const data = await response.json()
    expect(data.data.karma_balance).toBe(70) // 100 - 30
    expect(data.data.karma_escrow).toBe(30)
    console.log(`✓ Publisher karma: balance=${data.data.karma_balance}, escrow=${data.data.karma_escrow}`)
  })

  it('Step 4: Register Worker', async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/v1/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alias: 'E2E Worker',
        capabilities: [
          { skill: 'math', level: 5 },
          { skill: 'code', level: 4 }
        ]
      })
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.data.karma_balance).toBe(100)

    worker = data.data
    console.log(`✓ Worker registered: ${worker.agent_id}`)
  })

  it('Step 5: Worker claims the task', async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/v1/tasks/${taskId}/claim`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${worker.worker_key}` }
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('LOCKED')
    expect(data.data.payload_prompt.description).toBe('Calculate the 50th Fibonacci number')
    console.log(`✓ Task claimed by worker`)
  })

  it('Step 6: Worker submits result', async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/v1/tasks/${taskId}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${worker.worker_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payload_result: {
          result: 12586269025,
          computation_time_ms: 15,
          method: 'iterative'
        }
      })
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('SUBMITTED')
    console.log(`✓ Task result submitted`)
  })

  it('Step 7: Publisher settles (accepts) the task', async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/v1/tasks/${taskId}/settle`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publisher.worker_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ accepted: true })
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('COMPLETED')
    console.log(`✓ Task settled (accepted)`)
  })

  it('Step 8: Verify Karma transferred to Worker', async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/v1/agents/me`, {
      headers: { 'Authorization': `Bearer ${worker.worker_key}` }
    })

    const data = await response.json()
    expect(data.data.karma_balance).toBe(130) // 100 + 30
    console.log(`✓ Worker karma after reward: ${data.data.karma_balance}`)
  })

  it('Step 9: Verify Publisher escrow cleared', async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/v1/agents/me`, {
      headers: { 'Authorization': `Bearer ${publisher.worker_key}` }
    })

    const data = await response.json()
    expect(data.data.karma_escrow).toBe(0)
    expect(data.data.karma_balance).toBe(70) // Unchanged
    console.log(`✓ Publisher escrow cleared: ${data.data.karma_escrow}`)
  })

  it('Step 10: Verify transaction history', async () => {
    // Check worker's transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('agent_id', worker.agent_id)
      .order('created_at', { ascending: true })

    expect(error).toBeNull()
    expect(transactions).toHaveLength(2) // INITIAL_GRANT + TRANSFER
    
    expect(transactions![0].tx_type).toBe('INITIAL_GRANT')
    expect(transactions![0].amount).toBe(100)
    
    expect(transactions![1].tx_type).toBe('TRANSFER')
    expect(transactions![1].amount).toBe(30)
    
    console.log(`✓ Transaction history verified: ${transactions!.length} records`)
  })

  it('Step 11: Verify leaderboard updated', async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/v1/public/leaderboard?limit=10`)
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    
    // Find our agents in leaderboard
    const workerEntry = data.data.rankings.find((r: any) => r.agent_id === worker.agent_id)
    const publisherEntry = data.data.rankings.find((r: any) => r.agent_id === publisher.agent_id)
    
    expect(workerEntry).toBeDefined()
    expect(workerEntry.karma).toBe(130)
    
    expect(publisherEntry).toBeDefined()
    expect(publisherEntry.karma).toBe(70)
    
    console.log(`✓ Leaderboard updated: Worker rank=${workerEntry.rank}, Publisher rank=${publisherEntry.rank}`)
  })
})

/**
 * E2E Test: Task Rejection Flow
 */
describe('E2E: Task Rejection Flow', () => {
  let publisher: any
  let worker: any
  let taskId: string
  const supabase = createAdminClient()

  it('Complete rejection flow', async () => {
    // 1. Register agents
    const pubRes = await fetch(`${TEST_BASE_URL}/api/v1/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias: 'E2E Publisher 2', capabilities: [] })
    })
    publisher = (await pubRes.json()).data

    const workRes = await fetch(`${TEST_BASE_URL}/api/v1/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias: 'E2E Worker 2', capabilities: [{ skill: 'math', level: 5 }] })
    })
    worker = (await workRes.json()).data

    // 2. Publish task (20 Karma)
    const taskRes = await fetch(`${TEST_BASE_URL}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publisher.worker_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bounty: 20,
        payload_prompt: { description: 'Simple task' }
      })
    })
    taskId = (await taskRes.json()).data.task_id

    // 3. Worker claims
    await fetch(`${TEST_BASE_URL}/api/v1/tasks/${taskId}/claim`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${worker.worker_key}` }
    })

    // 4. Worker submits
    await fetch(`${TEST_BASE_URL}/api/v1/tasks/${taskId}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${worker.worker_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ payload_result: { data: 'wrong' } })
    })

    // 5. Publisher rejects
    const settleRes = await fetch(`${TEST_BASE_URL}/api/v1/tasks/${taskId}/settle`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publisher.worker_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ accepted: false })
    })

    const settleData = await settleRes.json()
    expect(settleData.data.status).toBe('FAILED')

    // 6. Verify refund to publisher
    const pubStats = await fetch(`${TEST_BASE_URL}/api/v1/agents/me`, {
      headers: { 'Authorization': `Bearer ${publisher.worker_key}` }
    })
    const pubData = await pubStats.json()
    expect(pubData.data.karma_balance).toBe(100) // Fully refunded
    expect(pubData.data.karma_escrow).toBe(0)

    // 7. Verify worker didn't get paid
    const workStats = await fetch(`${TEST_BASE_URL}/api/v1/agents/me`, {
      headers: { 'Authorization': `Bearer ${worker.worker_key}` }
    })
    const workData = await workStats.json()
    expect(workData.data.karma_balance).toBe(100) // No change

    console.log('✓ Task rejection flow verified')

    // Cleanup
    await supabase.from('transactions').delete().in('agent_id', [publisher.agent_id, worker.agent_id])
    await supabase.from('tasks').delete().eq('task_id', taskId)
    await supabase.from('agents').delete().in('agent_id', [publisher.agent_id, worker.agent_id])
  })
})
