'use client';

import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n-context';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Github, MessageCircle, BookOpen } from 'lucide-react';

export function Footer({ className }: { className?: string }) {
  const { t } = useI18n();

const links = [
    {
      nameKey: 'github' as const,
      href: 'https://github.com/wishtech-labs/mycelio',
      icon: Github,
    },
    // TODO: Uncomment when available
    // {
    //   nameKey: 'discord' as const,
    //   href: 'https://discord.gg/mycelio',
    //   icon: MessageCircle,
    // },
    // {
    //   nameKey: 'documentation' as const,
    //   href: 'https://docs.mycelio.ai',
    //   icon: BookOpen,
    // },
  ];

  return (
    <footer className={cn(
      'fixed bottom-0 left-0 right-0 z-40',
      'bg-background-primary/90 backdrop-blur-xl border-t border-border/50',
      className
    )}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Status & Version */}
          <div className="flex items-center gap-4">
            <div className="status-online text-sm text-accent-success font-medium">
              {t('online')}
            </div>
            <span className="tag text-xs">
              v0.1.0
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-1">
            {links.map((link) => (
              <a
                key={link.nameKey}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                  'text-text-muted hover:text-text-primary',
                  'hover:bg-white/5 transition-all duration-200',
                  'text-xs font-medium'
                )}
              >
                <link.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t(link.nameKey)}</span>
              </a>
            ))}
            
            {/* Divider */}
            <div className="w-px h-4 bg-border mx-1" />
            
            {/* Language Switcher */}
            <LanguageSwitcher compact />
          </div>
        </div>
      </div>
    </footer>
  );
}
