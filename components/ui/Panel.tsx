import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'terminal' | 'elevated';
  glow?: boolean;
}

export function Panel({ 
  children, 
  className,
  variant = 'default',
  glow = false
}: PanelProps) {
  const baseStyles = 'border p-4';
  
  const variantStyles = {
    default: 'bg-background-secondary border-border',
    terminal: 'bg-background-tertiary border-border font-mono',
    elevated: 'bg-background-secondary border-border shadow-lg shadow-black/50',
  };

  return (
    <div className={cn(
      baseStyles,
      variantStyles[variant],
      glow && 'glow-border',
      className
    )}>
      {children}
    </div>
  );
}
