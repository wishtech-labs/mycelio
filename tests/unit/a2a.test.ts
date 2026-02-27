import { describe, it, expect } from 'vitest'
import { getAgentCard, createJSONRPCResponse, createJSONRPCError } from '@/lib/a2a/server'
import { A2AErrorCodes } from '@/lib/a2a/types'

describe('A2A Protocol', () => {
  describe('Agent Card', () => {
    it('should return valid agent card', () => {
      const card = getAgentCard('http://localhost:3000')

      expect(card.name).toBe('Mycelio Task Network')
      expect(card.version).toBe('0.2.0')
      expect(card.url).toBe('http://localhost:3000')
      expect(card.skills).toHaveLength(3)
    })

    it('should have required capabilities', () => {
      const card = getAgentCard('http://localhost:3000')

      expect(card.capabilities).toBeDefined()
      expect(card.capabilities.stateTransitionHistory).toBe(true)
    })

    it('should have authentication scheme', () => {
      const card = getAgentCard('http://localhost:3000')

      expect(card.authentication).toBeDefined()
      expect(card.authentication?.schemes).toContain('apiKey')
    })
  })

  describe('JSON-RPC Helpers', () => {
    it('should create valid JSON-RPC response', () => {
      const response = createJSONRPCResponse('1', { taskId: '123' })

      expect(response.jsonrpc).toBe('2.0')
      expect(response.id).toBe('1')
      expect(response.result).toEqual({ taskId: '123' })
      expect(response.error).toBeUndefined()
    })

    it('should create valid JSON-RPC error', () => {
      const response = createJSONRPCError('1', A2AErrorCodes.TASK_NOT_FOUND, 'Task not found')

      expect(response.jsonrpc).toBe('2.0')
      expect(response.id).toBe('1')
      expect(response.result).toBeUndefined()
      expect(response.error).toEqual({
        code: A2AErrorCodes.TASK_NOT_FOUND,
        message: 'Task not found'
      })
    })

    it('should include error data when provided', () => {
      const response = createJSONRPCError('1', -32000, 'Error', { detail: 'info' })

      expect(response.error?.data).toEqual({ detail: 'info' })
    })
  })
})
