import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

export function Container({ 
  children, 
  className,
  size = 'lg'
}: ContainerProps) {
  return (
    <div className={cn(
      'mx-auto px-4 w-full',
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  );
}
