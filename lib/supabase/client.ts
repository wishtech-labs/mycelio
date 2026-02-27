import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * 客户端使用的 Supabase Client
 * 遵循 RLS (Row Level Security) 策略
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
