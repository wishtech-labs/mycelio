import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'terminal' | 'elevated' | 'glass';
  glow?: boolean;
}

export function Panel({ 
  children, 
  className,
  variant = 'default',
  glow = false
}: PanelProps) {
  const baseStyles = 'border rounded-lg p-4 transition-all duration-200';
  
  const variantStyles = {
    default: 'bg-background-secondary border-border hover:border-border-strong',
    terminal: 'bg-background-tertiary border-border font-mono',
    elevated: 'bg-background-elevated border-border shadow-lg hover:shadow-xl',
    glass: 'glass-card rounded-xl',
  };

  return (
    <div className={cn(
      baseStyles,
      variantStyles[variant],
      glow && 'glow-hover',
      className
    )}>
      {children}
    </div>
  );
}
