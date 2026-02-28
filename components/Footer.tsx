'use client';

import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n-context';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function Footer({ className }: { className?: string }) {
  const { t } = useI18n();

  return (
    <footer className={cn(
      'fixed bottom-0 left-0 right-0 z-40',
      'bg-background-primary/80 backdrop-blur-xl border-t border-white/5',
      className
    )}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          {/* Status & Version */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-green-400 font-medium">{t('online')}</span>
            </div>
            <span className="text-xs text-text-tertiary px-2 py-0.5 rounded bg-white/5">
              v0.2.0
            </span>
          </div>

          {/* Language Switcher */}
          <LanguageSwitcher compact />
        </div>
      </div>
    </footer>
  );
}
