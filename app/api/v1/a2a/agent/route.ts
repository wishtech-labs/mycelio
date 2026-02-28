import { NextResponse } from 'next/server'
import { getAgentCard } from '@/lib/a2a/server'

/**
 * Get allowed CORS origins
 * In production, restrict to specific domains
 */
function getAllowedOrigins(): string {
  const allowedOrigins = process.env.ALLOWED_A2A_ORIGINS
  
  if (process.env.NODE_ENV === 'development') {
    return '*' // Allow all in development
  }
  
  if (allowedOrigins) {
    // Return first allowed origin or specific origin based on request
    return allowedOrigins.split(',')[0].trim()
  }
  
  // Default to same-origin in production
  return process.env.NEXT_PUBLIC_APP_URL || 'https://mycelio.ai'
}

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
  
  // Get origin from request for CORS
  const origin = request.headers.get('origin')
  const allowedOrigin = process.env.NODE_ENV === 'development' 
    ? (origin || '*')
    : getAllowedOrigins()
  
  return NextResponse.json(agentCard, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Vary': 'Origin',
    }
  })
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin')
  const allowedOrigin = process.env.NODE_ENV === 'development'
    ? (origin || '*')
    : getAllowedOrigins()
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin',
    }
  })
}
