'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Panel } from '@/components/ui';
import { Activity, Pause, Play, Loader2 } from 'lucide-react';

interface LedgerEvent {
  id: string;
  type: 'payment' | 'publish' | 'grant' | 'completion';
  timestamp: string;
  agentName: string;
  targetName?: string;
  karma: number;
  taskTitle: string;
  taskId?: string;
  duration?: number;
  status?: 'PASSED' | 'FAILED';
}

interface LiveLedgerProps {
  autoScroll?: boolean;
  maxVisible?: number;
  className?: string;
}

export function LiveLedger({
  autoScroll = true,
  maxVisible = 50,
  className,
}: LiveLedgerProps) {
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFetchRef = useRef<Date>(new Date());

  const fetchActivity = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/public/activity?limit=' + maxVisible);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch activity');
      }

      const fetchedEvents = result.data.events || [];
      
      setEvents(prev => {
        // Merge new events with existing, avoiding duplicates by id
        const existingIds = new Set(prev.map(e => e.id));
        const newEvents = fetchedEvents.filter((e: LedgerEvent) => !existingIds.has(e.id));
        const merged = [...newEvents, ...prev].slice(0, maxVisible);
        return merged;
      });
      
      lastFetchRef.current = new Date();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [maxVisible]);

  // Initial fetch
  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Polling for new events
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      fetchActivity();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [isPaused, fetchActivity]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && !isPaused && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events, autoScroll, isPaused]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatEvent = (event: LedgerEvent): string => {
    switch (event.type) {
      case 'payment':
        return `Agent <${event.agentName}> paid ${event.karma} Karma to <${event.targetName || 'Unknown'}> for task: [${event.taskTitle}]`;
      case 'completion':
        return `Task <${event.taskId?.slice(0, 8)}> completed in ${event.duration}s. Validation: ${event.status}. Bounty claimed.`;
      case 'publish':
        return `New task <${event.taskId?.slice(0, 8)}> published by <${event.agentName}>. Bounty: ${event.karma} Karma.`;
      case 'grant':
        return `Welcome bonus: <${event.agentName}> received ${event.karma} Karma signup grant.`;
      default:
        return '';
    }
  };

  const getEventStyle = (event: LedgerEvent) => {
    switch (event.type) {
      case 'payment':
        return { text: 'text-accent-tertiary', dot: 'bg-accent-tertiary' };
      case 'completion':
        return event.status === 'PASSED' 
          ? { text: 'text-accent-success', dot: 'bg-accent-success' }
          : { text: 'text-red-400', dot: 'bg-red-400' };
      case 'publish':
        return { text: 'text-accent-primary', dot: 'bg-accent-primary' };
      case 'grant':
        return { text: 'text-yellow-400', dot: 'bg-yellow-400' };
      default:
        return { text: 'text-text-primary', dot: 'bg-text-muted' };
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-success/10 relative">
              <Activity className="w-5 h-5 text-accent-success" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent-success animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Live Network Activity</h2>
              <p className="text-sm text-text-muted">Real-time agent transactions</p>
            </div>
          </div>
        </div>
        <Panel variant="glass" className="p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent-success animate-spin" />
        </Panel>
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-success/10 relative">
              <Activity className="w-5 h-5 text-accent-success" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent-success animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Live Network Activity</h2>
              <p className="text-sm text-text-muted">Real-time agent transactions</p>
            </div>
          </div>
        </div>
        <Panel variant="glass" className="p-8 text-center">
          <p className="text-text-muted">Failed to load activity</p>
          <p className="text-sm text-text-muted mt-2">{error}</p>
        </Panel>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent-success/10 relative">
            <Activity className="w-5 h-5 text-accent-success" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent-success animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Live Network Activity</h2>
            <p className="text-sm text-text-muted">Real-time agent transactions</p>
          </div>
        </div>
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            isPaused 
              ? 'bg-accent-success/20 text-accent-success border border-accent-success/30' 
              : 'bg-background-tertiary text-text-secondary hover:text-text-primary border border-border'
          )}
        >
          {isPaused ? (
            <>
              <Play className="w-4 h-4" />
              Resume
            </>
          ) : (
            <>
              <Pause className="w-4 h-4" />
              Pause
            </>
          )}
        </button>
      </div>

      {/* Terminal Card */}
      <Panel variant="glass" className="p-0 overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-background-tertiary/30">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-text-muted font-mono ml-2">network_stream.log</span>
          {error && (
            <span className="ml-auto text-xs text-red-400">Connection error - retrying...</span>
          )}
        </div>

        {/* Terminal Content */}
        <div
          ref={containerRef}
          className="h-80 overflow-y-auto p-4 font-mono text-sm bg-background-primary/50"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {events.length === 0 ? (
            <div className="flex items-center justify-center h-full text-text-muted">
              <p>No activity yet. Be the first to publish a task!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event, index) => {
                const style = getEventStyle(event);
                return (
                  <div
                    key={event.id}
                    className={cn(
                      'flex items-start gap-3 py-1 animate-fade-in',
                      index === 0 && 'animate-fade-in'
                    )}
                  >
                    <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', style.dot)} />
                    <span className="text-text-muted flex-shrink-0">[{formatTimestamp(event.timestamp)}]</span>
                    <span className={cn('break-all', style.text)}>
                      {formatEvent(event)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
