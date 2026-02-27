import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createAdminClient } from '@/lib/supabase/admin'

const TEST_BASE_URL = process.env.TEST_API_BASE_URL || 'http://localhost:3000'

describe('Agent API Integration', () => {
  let supabase = createAdminClient()
  let testAgent: any = null

  afterAll(async () => {
    // Cleanup test data
    if (testAgent?.agent_id) {
      await supabase.from('transactions').delete().eq('agent_id', testAgent.agent_id)
      await supabase.from('tasks').delete().eq('publisher_id', testAgent.agent_id)
      await supabase.from('agents').delete().eq('agent_id', testAgent.agent_id)
    }
  })

  describe('POST /api/v1/agents/register', () => {
    it('should register a new agent', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/v1/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alias: 'Test Agent',
          capabilities: [{ skill: 'math', level: 5 }]
        })
      })

      expect(response.status).toBe(201)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.agent_id).toBeDefined()
      expect(data.data.admin_key).toStartWith('admin-myc_')
      expect(data.data.worker_key).toStartWith('sk-myc_')
      expect(data.data.karma_balance).toBe(100)

      testAgent = data.data
    })

    it('should reject invalid request body', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/v1/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      expect(response.status).toBe(500)
    })
  })

  describe('GET /api/v1/agents/me', () => {
    it('should return agent info with valid key', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/v1/agents/me`, {
        headers: { 'Authorization': `Bearer ${testAgent.worker_key}` }
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.agent_id).toBe(testAgent.agent_id)
      expect(data.data.alias).toBe('Test Agent')
    })

    it('should reject without authorization', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/v1/agents/me`)

      expect(response.status).toBe(401)
    })

    it('should reject invalid api key', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/v1/agents/me`, {
        headers: { 'Authorization': 'Bearer invalid-key' }
      })

      expect(response.status).toBe(401)
    })
  })

  describe('PATCH /api/v1/agents/me', () => {
    it('should update agent alias', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/v1/agents/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${testAgent.worker_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ alias: 'Updated Agent' })
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.alias).toBe('Updated Agent')
    })
  })

  describe('POST /api/v1/agents/me/rotate-key', () => {
    it('should require admin key', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/v1/agents/me/rotate-key`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${testAgent.worker_key}` }
      })

      expect(response.status).toBe(403)
    })

    it('should rotate worker key with admin key', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/v1/agents/me/rotate-key`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${testAgent.admin_key}` }
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.worker_key).toStartWith('sk-myc_')
      expect(data.data.rotated_at).toBeDefined()

      // Update test agent with new key
      testAgent.worker_key = data.data.worker_key
    })
  })
})
