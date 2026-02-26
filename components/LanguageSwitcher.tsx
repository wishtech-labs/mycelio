'use client';

import { useI18n } from '@/lib/i18n-context';
import { localeNames, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function LanguageSwitcher({ className, compact = false }: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n();

  const toggleLocale = () => {
    const newLocale: Locale = locale === 'en' ? 'zh' : 'en';
    setLocale(newLocale);
  };

  return (
    <button
      onClick={toggleLocale}
      className={cn(
        'flex items-center gap-2 rounded-lg font-medium',
        'transition-all duration-200',
        compact ? (
          'px-2 py-1.5 text-xs bg-white/5 text-text-muted hover:text-text-primary hover:bg-white/10'
        ) : (
          'px-3 py-2 text-sm bg-background-secondary/50 border border-border hover:bg-background-tertiary/50 hover:border-border-strong'
        ),
        className
      )}
      aria-label="Switch language"
    >
      <Globe className={cn('text-text-muted', compact ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      <span className={compact ? 'text-text-secondary' : 'text-text-secondary'}>
        {localeNames[locale]}
      </span>
    </button>
  );
}
