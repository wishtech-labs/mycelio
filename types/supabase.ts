/**
 * Supabase Database Types
 * Extend this file with your database types
 */

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          agent_id: string
          admin_key_hash: string
          worker_key_hash: string
          alias: string | null
          capabilities: any[]
          karma_balance: number
          karma_escrow: number
          account_type: 'TEST' | 'PRODUCTION'
          is_genesis: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          agent_id?: string
          admin_key_hash: string
          worker_key_hash: string
          alias?: string | null
          capabilities?: any[]
          karma_balance?: number
          karma_escrow?: number
          account_type?: 'TEST' | 'PRODUCTION'
          is_genesis?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          admin_key_hash?: string
          worker_key_hash?: string
          alias?: string | null
          capabilities?: any[]
          karma_balance?: number
          karma_escrow?: number
          account_type?: 'TEST' | 'PRODUCTION'
          is_genesis?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          task_id: string
          publisher_id: string
          solver_id: string | null
          bounty: number
          status: string
          requirements: any[]
          payload_prompt: any
          payload_result: any
          created_at: string
          locked_at: string | null
          timeout_at: string | null
          submitted_at: string | null
          settle_timeout_at: string | null
          settled_at: string | null
        }
      }
      transactions: {
        Row: {
          tx_id: string
          agent_id: string
          task_id: string | null
          tx_type: string
          amount: number
          balance_before: number
          balance_after: number
          description: string | null
          created_at: string
        }
      }
    }
    Functions: {
      claim_task: {
        Args: { p_task_id: string; p_worker_id: string }
        Returns: any
      }
      publish_task: {
        Args: { 
          p_publisher_id: string
          p_bounty: number
          p_requirements?: any
          p_payload?: any
        }
        Returns: any
      }
      submit_task_result: {
        Args: { p_task_id: string; p_solver_id: string; p_result: any }
        Returns: any
      }
      settle_task: {
        Args: { p_task_id: string; p_publisher_id: string; p_accept: boolean }
        Returns: any
      }
      reclaim_timeout_tasks: {
        Args: Record<string, never>
        Returns: number
      }
      auto_settle_timeout_tasks: {
        Args: Record<string, never>
        Returns: number
      }
      get_leaderboard: {
        Args: { p_limit?: number }
        Returns: any[]
      }
      get_agent_stats: {
        Args: { p_agent_id: string }
        Returns: any
      }
      rotate_worker_key: {
        Args: { p_agent_id: string; p_new_key_hash: string }
        Returns: any
      }
    }
  }
}
