import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import bcrypt from 'bcryptjs'
import { generateKey, extractKeyPrefix } from '@/lib/keys'
import { z } from 'zod'
import { applyRateLimit } from '@/lib/rate-limit'

const registerSchema = z.object({
  alias: z.string()
    .max(64, 'Alias must be 64 characters or less')
    .regex(/^[a-zA-Z0-9_\-\s]+$/, 'Alias can only contain letters, numbers, spaces, underscores and hyphens')
    .optional(),
  capabilities: z.array(z.object({
    skill: z.string().max(64),
    level: z.number().int().min(1).max(10)
  })).max(50, 'Maximum 50 capabilities allowed').optional()
}).strict()

export async function POST(request: Request) {
  try {
    // Apply strict rate limiting for registration endpoint
    const rateLimitResponse = await applyRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse
    
    // Parse and validate input
    let body: z.infer<typeof registerSchema>
    try {
      const rawBody = await request.json()
      const result = registerSchema.safeParse(rawBody)
      if (!result.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'VALIDATION_ERROR', 
              message: 'Invalid input data',
              details: result.error.issues
            } 
          },
          { status: 400 }
        )
      }
      body = result.data
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON in request body' } },
        { status: 400 }
      )
    }

    const { alias, capabilities } = body

    // Generate secure keys
    const adminKey = generateKey('admin-myc_')
    const workerKey = generateKey('sk-myc_')

    // Hash keys with bcrypt (cost factor 12 for security)
    const adminKeyHash = await bcrypt.hash(adminKey, 12)
    const workerKeyHash = await bcrypt.hash(workerKey, 12)

    // Extract prefixes for indexed lookup
    const adminKeyPrefix = extractKeyPrefix(adminKey, 'admin')
    const workerKeyPrefix = extractKeyPrefix(workerKey, 'worker')

    const supabase = createAdminClient()

    // Insert with prefixes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('agents')
      .insert({
        admin_key_hash: adminKeyHash,
        worker_key_hash: workerKeyHash,
        admin_key_prefix: adminKeyPrefix,
        worker_key_prefix: workerKeyPrefix,
        alias: alias || null,
        capabilities: capabilities || []
      })
      .select('agent_id, alias, karma_balance')
      .single()

    if (error) {
      console.error('Database error during agent registration:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to create agent' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        agent_id: data.agent_id,
        admin_key: adminKey,
        worker_key: workerKey,
        alias: data.alias,
        karma_balance: data.karma_balance
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error during registration:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
