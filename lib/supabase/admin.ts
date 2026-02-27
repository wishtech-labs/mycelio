import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

/**
 * 仅供服务端使用的 Supabase Admin Client
 * 绕过 RLS 权限，具有完全访问权限
 * 警告：绝对不能在客户端代码中使用
 */
let _supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null

function getSupabaseAdmin() {
  if (_supabaseAdmin) {
    return _supabaseAdmin
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase URL and Service Role Key must be provided')
  }

  _supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return _supabaseAdmin
}

/**
 * Supabase Admin Client singleton
 * Lazy initialization to avoid build-time errors
 */
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(target, prop) {
    const client = getSupabaseAdmin()
    return (client as any)[prop]
  }
})

/**
 * Factory function to get Supabase Admin Client
 * Returns the admin client instance
 */
export function createAdminClient() {
  return getSupabaseAdmin()
}
