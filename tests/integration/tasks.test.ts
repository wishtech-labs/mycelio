import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createAdminClient } from '@/lib/supabase/admin'

const TEST_BASE_URL = process.env.TEST_API_BASE_URL || 'http://localhost:3000'

describe('Task API Integration', () => {
  let supabase = createAdminClient()
  let publisher: any = null
  let worker: any = null
  let taskId: string | null = null

  beforeAll(async () => {
    // Create test agents
    const pubResponse = await fetch(`${TEST_BASE_URL}/api/v1/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias: 'Test Publisher', capabilities: [] })
    })
    publisher = (await pubResponse.json()).data

    const workResponse = await fetch(`${TEST_BASE_URL}/api/v1/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias: 'Test Worker', capabilities: [{ skill: 'math', level: 5 }] })
    })
    worker = (await workResponse.json()).data
  })

  afterAll(async () => {
    // Cleanup
    if (publisher?.agent_id) {
      await supabase.from('transactions').delete().eq('agent_id', publisher.agent_id)
      await supabase.from('tasks').delete().eq('publisher_id', publisher.agent_id)
      await supabase.from('agents').delete().eq('agent_id', publisher.agent_id)
    }
    if (worker?.agent_id) {
      await supabase.from('transactions').delete().eq('agent_id', worker.agent_id)
      await supabase.from('tasks').delete().eq('solver_id', worker.agent_id)
      await supabase.from('agents').delete().eq('agent_id', worker.agent_id)
    }
  })

  describe('POST /api/v1/tasks', () => {
    it('should publish a new task', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/v1/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publisher.worker_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bounty: 50,
          requirements: [{ skill: 'math', min_level: 3 }],
          payload_prompt: { description: 'Calculate fib(100)' }
        })
      })

      expect(response.status).toBe(201)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.task_id).toBeDefined()
      expect(data.data.status).toBe('OPEN')
      expect(data.data.bounty).toBe(50)

      taskId = data.data.task_id
    })

    it('should reject bounty below minimum', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/v1/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publisher.worker_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bounty: 5, // Below minimum of 10
          payload_prompt: { description: 'Test' }
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error.code).toBe('BOUNTY_TOO_LOW')
    })

    it('should freeze karma when publishing', async () => {
      // Check agent stats
      const response = await fetch(`${TEST_BASE_URL}/api/v1/agents/me/stats`, {
        headers: { 'Authorization': `Bearer ${publisher.worker_key}` }
      })

      const data = await response.json()
      // Initial 100 - 50 bounty = 50 balance, 50 escrow
      expect(data.data.karma_balance).toBe(50)
      expect(data.data.karma_escrow).toBe(50)
    })
  })

  describe('GET /api/v1/tasks/:taskId', () => {
    it('should get task details', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/v1/tasks/${taskId}`, {
        headers: { 'Authorization': `Bearer ${publisher.worker_key}` }
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.task_id).toBe(taskId)
      expect(data.data.status).toBe('OPEN')
    })

    it('should return 404 for non-existent task', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/v1/tasks/00000000-0000-0000-0000-000000000000`, {
        headers: { 'Authorization': `Bearer ${publisher.worker_key}` }
      })

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/v1/tasks/:taskId/claim', () => {
    it('should claim an open task', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/v1/tasks/${taskId}/claim`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${worker.worker_key}` }
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('LOCKED')
      expect(data.data.timeout_at).toBeDefined()
    })

    it('should reject claiming already claimed task', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/v1/tasks/${taskId}/claim`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${worker.worker_key}` }
      })

      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data.error.code).toBe('TASK_ALREADY_CLAIMED')
    })
  })

  describe('POST /api/v1/tasks/:taskId/submit', () => {
    it('should submit task result', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/v1/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${worker.worker_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payload_result: {
            result: 354224848179261915075,
            computation_time_ms: 42
          }
        })
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('SUBMITTED')
      expect(data.data.settle_timeout_at).toBeDefined()
    })

    it('should reject payload exceeding 64KB', async () => {
      const largePayload = 'x'.repeat(65 * 1024)
      
      const response = await fetch(`${TEST_BASE_URL}/api/v1/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${worker.worker_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payload_result: { data: largePayload }
        })
      })

      expect(response.status).toBe(413)
    })
  })

  describe('POST /api/v1/tasks/:taskId/settle', () => {
    it('should accept task and transfer karma', async () => {
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
    })

    it('should verify karma transfer to worker', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/v1/agents/me/stats`, {
        headers: { 'Authorization': `Bearer ${worker.worker_key}` }
      })

      const data = await response.json()
      // Initial 100 + 50 bounty = 150
      expect(data.data.karma_balance).toBe(150)
    })
  })
})
