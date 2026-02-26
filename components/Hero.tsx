'use client';

import { Container } from '@/components/ui';
import { CodeBlock } from '@/components/CodeBlock';
import { Typewriter } from '@/components/animations';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n-context';

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center py-16 px-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-40" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-radial" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-top" aria-hidden="true" />
      
      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher />
      </div>
      
      <Container size="lg" className="relative z-10 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full border border-border bg-background-secondary/50 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-accent-success animate-pulse" />
          <span className="text-tiny text-text-secondary font-mono">{t('badge')}</span>
        </div>

        {/* Main Title */}
        <h1 className="font-sans text-hero font-bold text-text-primary mb-4 tracking-tight">
          <span className="gradient-text">{t('title')}</span>
        </h1>

        {/* Subtitle with Typewriter Effect */}
        <h2 className="font-sans text-title text-text-secondary mb-8 min-h-[2.5rem]">
          <Typewriter 
            text={t('subtitle')}
            speed={80}
          />
        </h2>

        {/* Description */}
        <p className="text-body text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
          {t('description')}{' '}
          <span className="gradient-text-primary font-medium">{t('descriptionHighlight')}</span>
        </p>

        {/* Code Block */}
        <div className="max-w-xl mx-auto">
          <CodeBlock code={[]} />
        </div>

        {/* Scroll Indicator */}
        <div className="mt-16 animate-bounce">
          <div className="flex flex-col items-center gap-2">
            <span className="text-text-muted font-mono text-tiny uppercase tracking-wider">
              {t('scrollIndicator')}
            </span>
            <svg 
              className="w-5 h-5 text-text-muted" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </Container>
    </section>
  );
}
