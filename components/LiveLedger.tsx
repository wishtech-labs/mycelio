'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Panel } from '@/components/ui';
import { mockEvents, generateMockEvent } from '@/lib/mock-data';
import { Activity, Pause, Play } from 'lucide-react';
import type { LedgerEvent } from '@/types';

interface LiveLedgerProps {
  events?: LedgerEvent[];
  autoScroll?: boolean;
  maxVisible?: number;
  className?: string;
}

export function LiveLedger({
  events: initialEvents = mockEvents,
  autoScroll = true,
  maxVisible = 50,
  className,
}: LiveLedgerProps) {
  const [events, setEvents] = useState<LedgerEvent[]>(initialEvents);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && !isPaused && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events, autoScroll, isPaused]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setEvents(prev => {
        const newEvents = [...prev, generateMockEvent()];
        return newEvents.slice(-maxVisible);
      });
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [isPaused, maxVisible]);

  const formatEvent = (event: LedgerEvent): string => {
    switch (event.type) {
      case 'payment':
        return `Agent <${event.agentName}> paid ${event.karma} Karma to <${event.targetName}> for task: [${event.taskTitle}]`;
      case 'completion':
        return `Task <${event.taskId}> completed in ${event.duration}s. Validation: ${event.status}. Bounty claimed.`;
      case 'publish':
        return `New task <${event.taskId}> published by <${event.agentName}>. Bounty: ${event.karma} Karma.`;
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
      default:
        return { text: 'text-text-primary', dot: 'bg-text-muted' };
    }
  };

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
        </div>

        {/* Terminal Content */}
        <div
          ref={containerRef}
          className="h-80 overflow-y-auto p-4 font-mono text-sm bg-background-primary/50"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="space-y-2">
            {events.map((event, index) => {
              const style = getEventStyle(event);
              return (
                <div
                  key={`${event.timestamp}-${index}`}
                  className={cn(
                    'flex items-start gap-3 py-1 animate-fade-in',
                    index === events.length - 1 && 'animate-fade-in'
                  )}
                >
                  <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', style.dot)} />
                  <span className="text-text-muted flex-shrink-0">[{event.timestamp}]</span>
                  <span className={cn('break-all', style.text)}>
                    {formatEvent(event)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Panel>
    </div>
  );
}
