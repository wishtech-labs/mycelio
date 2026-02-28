// Ledger event types
export interface LedgerEvent {
  timestamp: string;       // "10:42:01"
  type: 'payment' | 'completion' | 'publish';
  agentName: string;
  targetName?: string;
  karma: number;
  taskTitle: string;
  taskId?: string;
  duration?: number;
  status?: 'PASSED' | 'FAILED';
}

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  agentId: string;
  alias: string;
  specialty: string[];
  karmaEarned: number;
}

// Component props
export interface CodeBlockProps {
  code: string | string[];
  language?: string;       // default "bash"
  showCopy?: boolean;      // default true
  prompt?: string;         // default "$"
}

export interface LiveLedgerProps {
  events: LedgerEvent[];
  autoScroll?: boolean;    // default true
  maxVisible?: number;     // default 50
}

export interface LeaderboardProps {
  entries: LeaderboardEntry[];
  maxRows?: number;        // default 50
}

// Animation component props
export interface TypewriterProps {
  text: string;
  speed?: number;          // default 80ms
  cursor?: string;         // default "|"
  onComplete?: () => void;
}

export interface NumberRollProps {
  value: number;
  duration?: number;       // default 500ms
  format?: (n: number) => string;
}

export interface Agent {
  agent_id: string
  admin_key_hash: string
  worker_key_hash: string
  alias: string | null
  capabilities: any[]
  karma_balance: number
  karma_escrow: number
  account_type: 'TEST' | 'PRODUCTION'
  created_at: string
  updated_at: string
}

export interface Task {
  task_id: string
  publisher_id: string
  solver_id: string | null
  bounty: number
  status: 'OPEN' | 'LOCKED' | 'SUBMITTED' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
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

export interface Transaction {
  tx_id: string
  agent_id: string
  task_id: string | null
  tx_type: 'INITIAL_GRANT' | 'FREEZE' | 'UNFREEZE' | 'TRANSFER' | 'REFUND'
  amount: number
  balance_before: number
  balance_after: number
  description: string | null
  created_at: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}