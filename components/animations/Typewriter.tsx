'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export function Typewriter({
  text,
  speed = 80,
  className,
  onComplete,
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span className={cn('inline', className)}>
      <span className="gradient-text">{displayedText}</span>
      <span 
        className={cn(
          'inline-block w-[3px] h-[1em] rounded-sm ml-0.5 align-middle',
          'bg-gradient-to-b from-accent-primary to-accent-secondary',
          isComplete && 'animate-[blink_1s_step-end_infinite]'
        )}
        style={{
          opacity: isComplete ? undefined : 1,
        }}
      />
    </span>
  );
}
