'use client';

import { useSyncExternalStore } from 'react';

interface ScanlineOverlayProps {
  enabled?: boolean;
}

export function ScanlineOverlay({ enabled = true }: ScanlineOverlayProps) {
  const reducedMotion = useSyncExternalStore(
    (callback) => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      mediaQuery.addEventListener('change', callback);
      return () => mediaQuery.removeEventListener('change', callback);
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false // Server-side default
  );

  if (!enabled || reducedMotion) return null;

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{
        background: `repeating-linear-gradient(
          0deg,
          rgba(0, 0, 0, 0.15),
          rgba(0, 0, 0, 0.15) 1px,
          transparent 1px,
          transparent 2px
        )`,
      }}
      aria-hidden="true"
    />
  );
}
