import { NextResponse } from 'next/server'
import { getAgentCard } from '@/lib/a2a/server'

/**
 * A2A Agent Card Endpoint
 * Returns the agent's capabilities and metadata
 * Required by A2A protocol for agent discovery
 * 
 * In production, this should be served from /.well-known/agent.json
 * For now, use /api/v1/a2a/agent as the endpoint
 */
export async function GET(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const agentCard = getAgentCard(appUrl)
  
  return NextResponse.json(agentCard, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    }
  })
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}
