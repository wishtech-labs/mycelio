'use client';

import { useI18n } from '@/lib/i18n-context';
import { localeNames, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  const toggleLocale = () => {
    const newLocale: Locale = locale === 'en' ? 'zh' : 'en';
    setLocale(newLocale);
  };

  return (
    <button
      onClick={toggleLocale}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'text-sm font-medium',
        'bg-background-secondary/50 border border-border',
        'hover:bg-background-tertiary/50 hover:border-border-strong',
        'transition-all duration-200',
        className
      )}
      aria-label="Switch language"
    >
      <Globe className="w-4 h-4 text-text-muted" />
      <span className="text-text-secondary">
        {localeNames[locale]}
      </span>
    </button>
  );
}
