/**
 * Secure Error Handling Utilities
 * Prevents sensitive information leakage in production
 */

export interface AppError {
  code: string
  message: string
  statusCode: number
}

/**
 * Error codes for API responses
 * Client-safe: never expose internal details
 */
export const ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: { code: 'UNAUTHORIZED', message: 'Invalid or missing API key', statusCode: 401 },
  FORBIDDEN: { code: 'FORBIDDEN', message: 'Insufficient permissions', statusCode: 403 },
  
  // Validation errors
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', message: 'Invalid input data', statusCode: 400 },
  INVALID_JSON: { code: 'INVALID_JSON', message: 'Invalid JSON in request body', statusCode: 400 },
  
  // Resource errors
  NOT_FOUND: { code: 'NOT_FOUND', message: 'Resource not found', statusCode: 404 },
  CONFLICT: { code: 'CONFLICT', message: 'Resource conflict', statusCode: 409 },
  
  // Business logic errors
  INSUFFICIENT_KARMA: { code: 'INSUFFICIENT_KARMA', message: 'Insufficient karma balance', statusCode: 400 },
  TASK_ALREADY_CLAIMED: { code: 'TASK_ALREADY_CLAIMED', message: 'Task has already been claimed', statusCode: 409 },
  TASK_NOT_SUBMITTABLE: { code: 'TASK_NOT_SUBMITTABLE', message: 'Task is not in submittable state', statusCode: 400 },
  TASK_NOT_SETTLABLE: { code: 'TASK_NOT_SETTLABLE', message: 'Task is not in settlable state', statusCode: 400 },
  TASK_NOT_CANCELABLE: { code: 'TASK_NOT_CANCELABLE', message: 'Task cannot be cancelled', statusCode: 400 },
  
  // Rate limiting
  RATE_LIMITED: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later', statusCode: 429 },
  
  // Server errors (generic messages for production)
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', statusCode: 500 },
  DATABASE_ERROR: { code: 'DATABASE_ERROR', message: 'Database operation failed', statusCode: 500 },
  SERVICE_UNAVAILABLE: { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable', statusCode: 503 },
  NOT_CONFIGURED: { code: 'NOT_CONFIGURED', message: 'Service not properly configured', statusCode: 503 },
  WEAK_SECRET: { code: 'WEAK_SECRET', message: 'Service configuration error', statusCode: 503 },
} as const

type ErrorCodeKey = keyof typeof ErrorCodes

/**
 * Create a safe error response
 * Strips internal details in production
 */
export function createErrorResponse(
  errorKey: ErrorCodeKey,
  details?: Record<string, unknown>
): { error: AppError & { details?: Record<string, unknown> }; statusCode: number } {
  const error = ErrorCodes[errorKey]
  
  // Only include details in development
  const response: AppError & { details?: Record<string, unknown> } = {
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
  }
  
  if (process.env.NODE_ENV === 'development' && details) {
    response.details = details
  }
  
  return { error: response, statusCode: error.statusCode }
}

/**
 * Safely log errors without exposing sensitive data
 */
export function logError(context: string, error: unknown, metadata?: Record<string, unknown>): void {
  const isDev = process.env.NODE_ENV === 'development'
  
  const safeMetadata = metadata ? sanitizeMetadata(metadata) : {}
  
  if (error instanceof Error) {
    console.error(`[${context}]`, {
      name: error.name,
      message: isDev ? error.message : 'Error occurred',
      stack: isDev ? error.stack : undefined,
      ...safeMetadata,
      timestamp: new Date().toISOString(),
    })
  } else {
    console.error(`[${context}]`, {
      error: isDev ? error : 'Unknown error',
      ...safeMetadata,
      timestamp: new Date().toISOString(),
    })
  }
}

/**
 * Sanitize metadata to remove sensitive fields
 */
function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = [
    'password',
    'secret',
    'key',
    'token',
    'authorization',
    'api_key',
    'apikey',
    'admin_key',
    'worker_key',
    'service_role_key',
    'anon_key',
  ]
  
  const sanitized: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase()
    
    // Check if key contains sensitive keywords
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

/**
 * Safe wrapper for async route handlers
 * Catches errors and returns safe responses
 */
export function withErrorHandler<T extends (...args: unknown[]) => Promise<Response>>(
  handler: T,
  context: string
): T {
  return (async (...args: unknown[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      logError(context, error)
      
      // Return safe generic error
      const { error: errorResponse, statusCode } = createErrorResponse('INTERNAL_ERROR')
      
      return new Response(
        JSON.stringify({ success: false, error: errorResponse }),
        {
          status: statusCode,
          headers: { 'Content-Type': 'application/json' },
        }
      ) as ReturnType<T>
    }
  }) as T
}

/**
 * Check if an error is a known application error
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'statusCode' in error
  )
}
