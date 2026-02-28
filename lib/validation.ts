import { z } from 'zod'

/**
 * Common validation schemas for API routes
 */

// Agent alias validation
export const aliasSchema = z.string()
  .max(64, 'Alias must be 64 characters or less')
  .regex(/^[a-zA-Z0-9_\-\s]+$/, 'Alias can only contain letters, numbers, spaces, underscores and hyphens')
  .optional()

// Capabilities validation
export const capabilitySchema = z.object({
  skill: z.string().max(64),
  level: z.number().int().min(1).max(10)
})

export const capabilitiesSchema = z.array(capabilitySchema)
  .max(50, 'Maximum 50 capabilities allowed')
  .optional()

// Task requirements validation
export const requirementSchema = z.object({
  skill: z.string().max(64),
  min_level: z.number().int().min(1).max(10)
})

// Bounty validation
export const bountySchema = z.number()
  .int()
  .min(10, 'Minimum bounty is 10 Karma')
  .max(1000000, 'Maximum bounty is 1,000,000 Karma')

// Payload validation (max 64KB)
export const payloadSchema = z.record(z.string(), z.unknown())
  .refine(
    (val) => JSON.stringify(val).length <= 64 * 1024,
    'Payload exceeds 64KB limit'
  )
  .optional()

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format')

// Pagination params
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
})

/**
 * Safe JSON parser with validation
 */
export async function parseJsonSafe<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: z.ZodError }> {
  try {
    const rawBody = await request.json()
    const result = schema.safeParse(rawBody)
    
    if (!result.success) {
      return { success: false, error: result.error }
    }
    
    return { success: true, data: result.data }
  } catch {
    // Invalid JSON
    const error = new z.ZodError([{
      code: 'custom',
      path: [],
      message: 'Invalid JSON in request body'
    }])
    return { success: false, error }
  }
}

/**
 * Format Zod error for API response
 */
export function formatZodError(error: z.ZodError): { code: string; message: string; details: z.ZodIssue[] } {
  return {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input data',
    details: error.issues
  }
}
