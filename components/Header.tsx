'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Github, Menu, X, BookOpen } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import Link from 'next/link';
import Image from 'next/image';

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
          ? 'bg-background-primary/90 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-black/10' 
          : 'bg-transparent'
      )}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-accent-primary/20 rounded-xl blur-xl group-hover:bg-accent-primary/40 transition-all duration-500" />
              <div className="relative w-9 h-9 rounded-xl overflow-hidden ring-2 ring-white/10 group-hover:ring-accent-primary/50 transition-all duration-300">
                <Image
                  src="/logo512.png"
                  alt="Mycelio.ai"
                  width={36}
                  height={36}
                  className="object-cover"
                  priority
                />
              </div>
            </div>
            <span className="text-lg font-bold gradient-text tracking-tight">
              Mycelio
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/docs"
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg',
                'text-text-secondary hover:text-text-primary',
                'hover:bg-white/5 transition-all duration-200',
                'text-sm font-medium'
              )}
            >
              <BookOpen className="w-4 h-4" />
              <span>Docs</span>
            </Link>
            <a
              href="https://github.com/wishtech-labs/mycelio-hub"
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
            <div className="w-px h-4 bg-border mx-1" />
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
              <Link
                href="/docs"
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>Docs</span>
              </Link>
              <a
                href="https://github.com/wishtech-labs/mycelio-hub"
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
