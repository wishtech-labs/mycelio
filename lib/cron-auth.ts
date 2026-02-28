import { NextResponse } from 'next/server'

/**
 * Vercel Cron IP ranges
 * Updated with actual Vercel IPv4 ranges for production
 * @see https://vercel.com/docs/security/deployment-protection#vercel-cron-jobs
 * @see https://www.vercel.com/docs/concepts/limits/ips
 * 
 * Note: Vercel IPs may change. Monitor Vercel documentation and update as needed.
 * Current as of 2025-02
 */
const VERCEL_CRON_IPS = [
  // Local development
  '127.0.0.1',
  '::1',
  // Vercel IPv4 ranges (US East - iad1)
  '66.33.60.0/24',
  '66.33.62.0/24',
  '69.67.128.0/24',
  '69.67.131.0/24',
  '76.76.21.0/24',
  '76.76.156.0/24',
  // Vercel IPv4 ranges (EU West - fra1)
  '88.218.64.0/24',
  '88.218.66.0/24',
  // Vercel IPv4 ranges (Asia Pacific - sin1)
  '150.109.120.0/24',
  '150.109.122.0/24',
]

// Additional production IPs can be configured via environment variable
// Format: comma-separated list of IPs or CIDR ranges
const getAllowedCronIPs = (): string[] => {
  const envIPs = process.env.ALLOWED_CRON_IPS
  if (envIPs) {
    return [...VERCEL_CRON_IPS, ...envIPs.split(',').map(ip => ip.trim())]
  }
  return VERCEL_CRON_IPS
}

/**
 * Check if an IP matches a CIDR range or exact match
 * Supports both IPv4 and simple CIDR notation (e.g., 76.76.21.0/24)
 */
function ipMatches(ip: string, allowedIP: string): boolean {
  // Exact match
  if (ip === allowedIP) {
    return true
  }
  
  // CIDR range check (basic implementation for IPv4)
  if (allowedIP.includes('/')) {
    const [rangeIp, prefixStr] = allowedIP.split('/')
    const prefix = parseInt(prefixStr, 10)
    
    if (isNaN(prefix) || prefix < 0 || prefix > 32) {
      return false
    }
    
    const ipParts = ip.split('.').map(Number)
    const rangeParts = rangeIp.split('.').map(Number)
    
    if (ipParts.length !== 4 || rangeParts.length !== 4) {
      return false
    }
    
    // Calculate how many bits to compare
    const fullBytes = Math.floor(prefix / 8)
    const remainingBits = prefix % 8
    
    // Compare full bytes
    for (let i = 0; i < fullBytes; i++) {
      if (ipParts[i] !== rangeParts[i]) {
        return false
      }
    }
    
    // Compare remaining bits if any
    if (remainingBits > 0 && fullBytes < 4) {
      const mask = 0xFF << (8 - remainingBits)
      return (ipParts[fullBytes] & mask) === (rangeParts[fullBytes] & mask)
    }
    
    return true
  }
  
  return false
}

/**
 * Check if client IP is in allowed list
 */
function isAllowedIP(clientIp: string, allowedIPs: string[]): boolean {
  return allowedIPs.some(allowed => ipMatches(clientIp, allowed))
}

/**
 * Verify Cron request from Vercel
 * Checks both secret and IP address
 */
export function verifyCronRequest(request: Request): { success: true } | { success: false; response: NextResponse } {
  // Verify Cron Secret
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET
  
  if (!expectedSecret) {
    console.error('[CRON] CRON_SECRET not configured - cron jobs are disabled')
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: { code: 'NOT_CONFIGURED', message: 'Cron secret not configured' } },
        { status: 503 }
      )
    }
  }
  
  // In production, reject empty secrets
  if (process.env.NODE_ENV === 'production' && expectedSecret.length < 32) {
    console.error('[CRON] CRON_SECRET is too short - must be at least 32 characters')
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: { code: 'WEAK_SECRET', message: 'Cron secret is too weak' } },
        { status: 503 }
      )
    }
  }
  
  if (authHeader !== `Bearer ${expectedSecret}`) {
    // Log with minimal info to avoid leaking data
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    console.warn('[CRON] Invalid cron secret attempt', {
      ip: clientIp.substring(0, 15), // Truncate IP for privacy
      timestamp: new Date().toISOString(),
    })
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
        { status: 401 }
      )
    }
  }

  // Verify source IP in production
  if (process.env.NODE_ENV === 'production') {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const allowedIPs = getAllowedCronIPs()
    
    // Use CIDR-aware IP matching
    if (!isAllowedIP(clientIp, allowedIPs)) {
      console.warn('[CRON] Cron request from unauthorized IP:', {
        ip: clientIp.substring(0, 15),
        timestamp: new Date().toISOString(),
      })
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Invalid source IP' } },
          { status: 403 }
        )
      }
    }
  }

  return { success: true }
}
