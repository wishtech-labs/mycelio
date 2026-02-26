'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Github, Menu, X } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n-context';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled 
          ? 'bg-background-primary/80 backdrop-blur-xl border-b border-border/50' 
          : 'bg-transparent'
      )}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
<Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-accent-primary/20 rounded-lg blur-lg group-hover:bg-accent-primary/30 transition-colors" />
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
            </div>
            <span className="text-lg font-semibold gradient-text">
              Mycelio.ai
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
<a
              href="https://github.com/wishtech-labs/mycelio"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg',
                'text-text-secondary hover:text-text-primary',
                'hover:bg-white/5 transition-all duration-200',
                'text-sm font-medium'
              )}
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <LanguageSwitcher />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col gap-2">
<a
                href="https://github.com/wishtech-labs/mycelio"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>
              <div className="px-4 py-2">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
