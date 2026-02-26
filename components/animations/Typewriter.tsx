'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TypewriterProps {
  text: string;
  speed?: number;
  cursor?: string;
  onComplete?: () => void;
  className?: string;
}

export function Typewriter({
  text,
  speed = 80,
  cursor: _cursor = '▌',
  onComplete,
  className,
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
      {displayedText}
      <span 
        className={cn(
          'inline-block w-[3px] h-[1.1em] bg-accent-green ml-0.5 align-middle',
          isComplete ? 'animate-[blink_1s_step-end_infinite]' : ''
        )}
        style={{
          animation: isComplete ? 'blink 1s step-end infinite' : 'none',
          opacity: isComplete ? undefined : 1,
        }}
      />
    </span>
  );
}
