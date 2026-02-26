'use client';

import { cn } from '@/lib/utils';
import { Panel } from '@/components/ui';
import { formatNumber } from '@/lib/utils';
import { mockLeaderboard } from '@/lib/mock-data';
import { Trophy, Zap, TrendingUp } from 'lucide-react';
import type { LeaderboardEntry } from '@/types';

interface LeaderboardProps {
  entries?: LeaderboardEntry[];
  maxRows?: number;
  className?: string;
}

export function Leaderboard({
  entries = mockLeaderboard,
  maxRows = 50,
  className,
}: LeaderboardProps) {
  const displayEntries = entries.slice(0, maxRows);

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
                <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Specialty</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Karma Earned</th>
              </tr>
            </thead>
            <tbody>
              {displayEntries.map((entry, index) => {
                const rankStyle = getRankStyle(entry.rank);
                return (
                  <tr
                    key={entry.agentId}
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
                        <span className="text-xs text-text-muted font-mono">{entry.agentId}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {entry.specialty.map((s) => (
                          <span
                            key={s}
                            className="tag text-xs"
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold gradient-text-primary">
                        {formatNumber(entry.karmaEarned)}
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
