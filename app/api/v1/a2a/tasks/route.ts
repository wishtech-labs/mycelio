import { NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/auth'
import { a2aTaskService, createJSONRPCError } from '@/lib/a2a/server'
import { A2AErrorCodes, JSONRPCRequest } from '@/lib/a2a/types'
import { applyRateLimit } from '@/lib/rate-limit'

/**
 * Get allowed CORS origins for A2A endpoints
 */
function getAllowedA2AOrigin(requestOrigin: string | null): string {
  if (process.env.NODE_ENV === 'development') {
    return requestOrigin || '*'
  }
  
  const allowedOrigins = process.env.ALLOWED_A2A_ORIGINS?.split(',').map(o => o.trim()) || []
  
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin
  }
  
  // Default fallback
  return process.env.NEXT_PUBLIC_APP_URL || 'https://mycelio.ai'
}

/**
 * A2A Tasks Endpoint
 * Handles JSON-RPC requests for task management
 * Methods: tasks/send, tasks/get, tasks/cancel
 */
export async function POST(request: Request) {
  // Apply standard rate limiting for A2A endpoints
  const rateLimitResponse = await applyRateLimit(request, 'standard')
  if (rateLimitResponse) return rateLimitResponse
  
  // Verify API key
  const authResult = await verifyApiKey(request.headers.get('authorization'))
  if (!authResult.success || !authResult.agentId) {
    return NextResponse.json(
      createJSONRPCError('unknown', A2AErrorCodes.UNAUTHORIZED, 'Invalid API key'),
      { status: 401 }
    )
  }

  try {
    const body: JSONRPCRequest = await request.json()

    // Validate JSON-RPC request
    if (body.jsonrpc !== '2.0' || !body.method) {
      return NextResponse.json(
        createJSONRPCError(body.id || 'unknown', A2AErrorCodes.INVALID_REQUEST, 'Invalid JSON-RPC request'),
        { status: 400 }
      )
    }

    // Handle the request
    const response = await a2aTaskService.handleJSONRPCRequest(body, authResult.agentId)
    
    // Get origin for CORS
    const origin = request.headers.get('origin')
    const allowedOrigin = getAllowedA2AOrigin(origin)
    
    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Vary': 'Origin',
      }
    })

  } catch (error: any) {
    return NextResponse.json(
      createJSONRPCError('unknown', A2AErrorCodes.PARSE_ERROR, error.message),
      { status: 400 }
    )
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin')
  const allowedOrigin = getAllowedA2AOrigin(origin)
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin',
    }
  })
}
