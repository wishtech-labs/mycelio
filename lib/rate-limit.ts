import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

/**
 * Rate limiting configuration for API routes
 * Uses Upstash Redis for distributed rate limiting
 */

// Redis client initialization (lazy)
let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  
  if (!url || !token) {
    console.warn('[RateLimit] Redis not configured, rate limiting disabled')
    return null
  }
  
  redis = new Redis({ url, token })
  return redis
}

// Get Redis client once
const redisClient = getRedis()

// Different rate limiters for different endpoints
const rateLimiters = {
  // Strict: Authentication endpoints (register, key rotation)
  strict: new Ratelimit({
    redis: redisClient || undefined as unknown as Redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: 'ratelimit_strict',
  }),
  
  // Standard: General API endpoints
  standard: new Ratelimit({
    redis: redisClient || undefined as unknown as Redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
    prefix: 'ratelimit_standard',
  }),
  
  // Relaxed: Public read-only endpoints
  public: new Ratelimit({
    redis: redisClient || undefined as unknown as Redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit_public',
  }),
  
  // Task operations: Claim, submit, settle
  task: new Ratelimit({
    redis: redisClient || undefined as unknown as Redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: true,
    prefix: 'ratelimit_task',
  }),
}

type RateLimitTier = keyof typeof rateLimiters

/**
 * Get client IP from request
 */
function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

/**
 * Apply rate limiting to a request
 * @param request - The incoming request
 * @param tier - Rate limit tier to apply
 * @param identifier - Optional custom identifier (defaults to IP)
 * @returns Response if rate limited, null if allowed
 */
export async function rateLimit(
  request: Request,
  tier: RateLimitTier = 'standard',
  identifier?: string
): Promise<NextResponse | null> {
  const redisClient = getRedis()
  
  // If Redis not configured, skip rate limiting in development
  if (!redisClient) {
    if (process.env.NODE_ENV === 'development') {
      return null
    }
    // In production, log warning but allow request
    console.warn('[RateLimit] Rate limiting disabled in production - Redis not configured')
    return null
  }
  
  const limiter = rateLimiters[tier]
  const key = identifier || getClientIP(request)
  
  try {
    const { success, limit, remaining, reset } = await limiter.limit(key)
    
    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests, please try again later',
          },
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }
    
    return null
  } catch (error) {
    console.error('[RateLimit] Error applying rate limit:', error)
    // Fail open - allow request if rate limiting fails
    return null
  }
}

/**
 * Middleware helper for route handlers
 * Usage: 
 *   const rateLimitResponse = await applyRateLimit(request, 'standard')
 *   if (rateLimitResponse) return rateLimitResponse
 */
export async function applyRateLimit(
  request: Request,
  tier: RateLimitTier = 'standard'
): Promise<NextResponse | null> {
  return rateLimit(request, tier)
}

/**
 * Check if rate limiting is configured and healthy
 */
export function isRateLimitConfigured(): boolean {
  return !!getRedis()
}
