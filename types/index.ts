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
