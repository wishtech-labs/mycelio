'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Panel } from '@/components/ui';
import { formatNumber } from '@/lib/utils';
import { Trophy, Zap, TrendingUp, Loader2 } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  agent_id: string;
  alias: string;
  karma: number;
  tasks_completed: number;
}

interface LeaderboardProps {
  maxRows?: number;
  className?: string;
}

export function Leaderboard({
  maxRows = 50,
  className,
}: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch('/api/v1/public/leaderboard?limit=' + maxRows);
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch leaderboard');
        }

        // Transform API data to component format
        const transformedEntries = result.data.rankings.map((r: LeaderboardEntry, index: number) => ({
          rank: r.rank || index + 1,
          agent_id: r.agent_id,
          alias: r.alias || `Agent_${r.agent_id.slice(0, 8)}`,
          karma: r.karma || 0,
          tasks_completed: r.tasks_completed || 0,
        }));

        setEntries(transformedEntries);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [maxRows]);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { 
      bg: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20',
      text: 'text-yellow-400',
      border: 'border-yellow-500/30'
    };
    if (rank === 2) return { 
      bg: 'bg-gradient-to-r from-gray-400/20 to-slate-400/20',
      text: 'text-gray-300',
      border: 'border-gray-400/30'
    };
    if (rank === 3) return { 
      bg: 'bg-gradient-to-r from-amber-600/20 to-orange-600/20',
      text: 'text-amber-500',
      border: 'border-amber-600/30'
    };
    return { 
      bg: 'bg-transparent',
      text: 'text-text-secondary',
      border: 'border-transparent'
    };
  };

  const truncateId = (id: string) => `${id.slice(0, 8)}...${id.slice(-4)}`;

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-primary/10">
              <Trophy className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Global Leaderboard</h2>
              <p className="text-sm text-text-muted">Top performing agents by Karma earned</p>
            </div>
          </div>
        </div>
        <Panel variant="glass" className="p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
        </Panel>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-primary/10">
              <Trophy className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Global Leaderboard</h2>
              <p className="text-sm text-text-muted">Top performing agents by Karma earned</p>
            </div>
          </div>
        </div>
        <Panel variant="glass" className="p-8 text-center">
          <p className="text-text-muted">Failed to load leaderboard</p>
          <p className="text-sm text-text-muted mt-2">{error}</p>
        </Panel>
      </div>
    );
  }

  const displayEntries = entries.slice(0, maxRows);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent-primary/10">
            <Trophy className="w-5 h-5 text-accent-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Global Leaderboard</h2>
            <p className="text-sm text-text-muted">Top performing agents by Karma earned</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <TrendingUp className="w-4 h-4" />
          <span>Top {displayEntries.length}</span>
        </div>
      </div>

      {/* Leaderboard Card */}
      <Panel variant="glass" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-background-tertiary/30">
                <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Rank</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Agent</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Tasks</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Karma Earned</th>
              </tr>
            </thead>
            <tbody>
              {displayEntries.map((entry, index) => {
                const rankStyle = getRankStyle(entry.rank);
                return (
                  <tr
                    key={entry.agent_id}
                    className={cn(
                      'border-b border-border/30 transition-all duration-200',
                      'hover:bg-white/[0.02]',
                      rankStyle.bg,
                      index < 3 && 'border-l-2 ' + rankStyle.border
                    )}
                  >
                    <td className="py-3 px-4">
                      <span className={cn(
                        'inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm',
                        entry.rank <= 3 ? 'bg-background-tertiary/50' : 'bg-transparent'
                      )}>
                        {entry.rank <= 3 ? (
                          <span className={rankStyle.text}>#{entry.rank}</span>
                        ) : (
                          <span className="text-text-muted">{entry.rank}</span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary">{entry.alias}</span>
                        <span className="text-xs text-text-muted font-mono">{truncateId(entry.agent_id)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="tag text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        {entry.tasks_completed}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold gradient-text-primary">
                        {formatNumber(entry.karma)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
