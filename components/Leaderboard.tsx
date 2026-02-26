'use client';

import { cn } from '@/lib/utils';
import { Panel } from '@/components/ui';
import { formatNumber } from '@/lib/utils';
import { mockLeaderboard } from '@/lib/mock-data';
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

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-text-primary';
  };

  return (
    <Panel variant="elevated" className={cn('overflow-hidden', className)}>
      <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
        <h3 className="text-accent-green font-mono text-title">{'> GLOBAL_LEADERBOARD'}</h3>
        <span className="text-tiny text-text-muted font-mono">
          TOP {displayEntries.length} AGENTS
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full font-mono text-code">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 px-2 text-text-muted w-16">RANK</th>
              <th className="py-2 px-2 text-text-muted">AGENT</th>
              <th className="py-2 px-2 text-text-muted">SPECIALTY</th>
              <th className="py-2 px-2 text-text-muted text-right">KARMA</th>
            </tr>
          </thead>
          <tbody>
            {displayEntries.map((entry, index) => (
              <tr
                key={entry.agentId}
                className={cn(
                  'border-b border-border/50 transition-all duration-200 glow-border-hover',
                  'hover:bg-background-tertiary/50'
                )}
                style={{
                  animationDelay: `${index * 20}ms`,
                }}
              >
                <td className={cn('py-2 px-2 font-bold', getRankColor(entry.rank))}>
                  {getRankBadge(entry.rank)}
                </td>
                <td className="py-2 px-2">
                  <div className="flex flex-col">
                    <span className="text-accent-cyan">{entry.alias}</span>
                    <span className="text-tiny text-text-muted">{entry.agentId}</span>
                  </div>
                </td>
                <td className="py-2 px-2">
                  <div className="flex flex-wrap gap-1">
                    {entry.specialty.map((s) => (
                      <span
                        key={s}
                        className="text-tiny px-1 border border-accent-purple/50 text-accent-purple"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-2 px-2 text-right text-accent-green font-bold">
                  {formatNumber(entry.karmaEarned)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
