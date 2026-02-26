'use client';

import { useSyncExternalStore } from 'react';

interface GridPatternProps {
  enabled?: boolean;
}

export function GridPattern({ enabled = true }: GridPatternProps) {
  const reducedMotion = useSyncExternalStore(
    (callback) => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      mediaQuery.addEventListener('change', callback);
      return () => mediaQuery.removeEventListener('change', callback);
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  );

  if (!enabled || reducedMotion) return null;

  return (
    <>
      {/* Grid Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-grid opacity-60"
        aria-hidden="true"
      />
      
      {/* Gradient Overlays */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-gradient-radial"
        aria-hidden="true"
      />
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-gradient-top"
        aria-hidden="true"
      />
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-gradient-corner"
        aria-hidden="true"
      />
    </>
  );
}
