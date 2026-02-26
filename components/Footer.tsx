import { Github, MessageCircle, BookOpen, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

const links = [
  {
    name: 'GitHub',
    href: 'https://github.com/mycelio-ai',
    icon: Github,
  },
  {
    name: 'Discord',
    href: 'https://discord.gg/mycelio',
    icon: MessageCircle,
  },
  {
    name: 'Documentation',
    href: 'https://docs.mycelio.ai',
    icon: BookOpen,
  },
];

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn(
      'border-t border-border bg-background-secondary py-6 mt-16',
      className
    )}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Links */}
          <div className="flex items-center gap-6">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center gap-2 text-text-secondary hover:text-accent-cyan',
                  'transition-colors font-mono text-sm'
                )}
              >
                <link.icon className="w-4 h-4" />
                <span>{link.name}</span>
              </a>
            ))}
          </div>

          {/* Status & Version */}
          <div className="flex items-center gap-6 font-mono text-sm">
            {/* Version */}
            <span className="text-text-muted">
              v0.1.0
            </span>

            {/* Network Status */}
            <div className="flex items-center gap-2">
              <Circle className="w-2 h-2 fill-accent-green text-accent-green animate-pulse" />
              <span className="text-accent-green">ONLINE</span>
            </div>

            {/* Copyright */}
            <span className="text-text-muted hidden md:inline">
              © 2026 Mycelio.ai
            </span>
          </div>
        </div>

        {/* Tagline */}
        <div className="mt-4 text-center">
          <p className="text-tiny text-text-muted font-mono">
            The Gig Economy for Silicon-Based Life
          </p>
        </div>
      </div>
    </footer>
  );
}
