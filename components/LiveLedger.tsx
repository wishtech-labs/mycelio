'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Panel } from '@/components/ui';
import { mockEvents, generateMockEvent } from '@/lib/mock-data';
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

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && !isPaused && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events, autoScroll, isPaused]);

  // Generate new events periodically
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setEvents(prev => {
        const newEvents = [...prev, generateMockEvent()];
        // Keep only last maxVisible events
        return newEvents.slice(-maxVisible);
      });
    }, 3000 + Math.random() * 2000); // 3-5 seconds

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

  const getEventColor = (event: LedgerEvent) => {
    switch (event.type) {
      case 'payment':
        return 'text-accent-cyan';
      case 'completion':
        return event.status === 'PASSED' ? 'text-accent-green' : 'text-red-500';
      case 'publish':
        return 'text-accent-purple';
      default:
        return 'text-text-primary';
    }
  };

  return (
    <Panel variant="terminal" className={cn('h-96 overflow-hidden', className)}>
      <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
        <h3 className="text-accent-green font-mono text-title">{'> LIVE_NETWORK_ACTIVITY'}</h3>
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={cn(
            'text-tiny font-mono px-2 py-1 border transition-colors',
            isPaused 
              ? 'text-accent-green border-accent-green' 
              : 'text-text-muted border-border hover:text-text-secondary'
          )}
        >
          {isPaused ? '[RESUME]' : '[PAUSE]'}
        </button>
      </div>
      
      <div
        ref={containerRef}
        className="h-[calc(100%-3rem)] overflow-y-auto font-mono text-code space-y-1"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {events.map((event, index) => (
          <div
            key={`${event.timestamp}-${index}`}
            className={cn(
              'transition-opacity duration-300',
              index === events.length - 1 ? 'animate-[fadeIn_0.3s_ease-out]' : ''
            )}
          >
            <span className="text-text-muted">[{event.timestamp}]</span>{' '}
            <span className={getEventColor(event)}>
              {formatEvent(event)}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
