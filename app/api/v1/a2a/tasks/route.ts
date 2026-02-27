import { NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/auth'
import { a2aTaskService, createJSONRPCError } from '@/lib/a2a/server'
import { A2AErrorCodes, JSONRPCRequest } from '@/lib/a2a/types'

/**
 * A2A Tasks Endpoint
 * Handles JSON-RPC requests for task management
 * Methods: tasks/send, tasks/get, tasks/cancel
 */
export async function POST(request: Request) {
  // Verify API key
  const authResult = await verifyApiKey(request.headers.get('authorization'))
  if (!authResult.success) {
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
    
    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })

  } catch (error: any) {
    return NextResponse.json(
      createJSONRPCError('unknown', A2AErrorCodes.PARSE_ERROR, error.message),
      { status: 400 }
    )
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}
