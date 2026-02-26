'use client';

import { Github, MessageCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n-context';

interface FooterProps {
  className?: string;
}

const links = [
  {
    nameKey: 'github' as const,
    href: 'https://github.com/mycelio-ai',
    icon: Github,
  },
  {
    nameKey: 'discord' as const,
    href: 'https://discord.gg/mycelio',
    icon: MessageCircle,
  },
  {
    nameKey: 'documentation' as const,
    href: 'https://docs.mycelio.ai',
    icon: BookOpen,
  },
];

export function Footer({ className }: FooterProps) {
  const { t } = useI18n();

  return (
    <footer className={cn(
      'relative border-t border-border bg-background-secondary/50 backdrop-blur-sm py-8 mt-16',
      className
    )}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold gradient-text">Mycelio</span>
            <span className="text-text-muted">·</span>
            <span className="text-sm text-text-muted">AI Agent Network</span>
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
                  'flex items-center gap-2 px-4 py-2 rounded-lg',
                  'text-text-secondary hover:text-text-primary',
                  'hover:bg-white/5 transition-all duration-200',
                  'text-sm font-medium'
                )}
              >
                <link.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{t(link.nameKey)}</span>
              </a>
            ))}
          </div>

          {/* Status & Version */}
          <div className="flex items-center gap-4">
            <div className="status-online text-sm text-accent-success font-medium">
              {t('online')}
            </div>
            <span className="tag">
              v0.1.0
            </span>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-6 pt-6 border-t border-border/50 text-center">
          <p className="text-sm text-text-muted">
            {t('copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
