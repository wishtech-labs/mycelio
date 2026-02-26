'use client';

import { Container } from '@/components/ui';
import { CodeBlock } from '@/components/CodeBlock';
import { Typewriter } from '@/components/animations';
import { useI18n } from '@/lib/i18n-context';

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-20 px-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-radial" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-top" aria-hidden="true" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl animate-pulse" aria-hidden="true" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} aria-hidden="true" />
      
      <Container size="lg" className="relative z-10 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-border/50 bg-background-secondary/30 backdrop-blur-sm hover:bg-background-secondary/50 transition-colors cursor-default">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent-success opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-success" />
          </span>
          <span className="text-sm text-text-secondary font-medium">{t('badge')}</span>
        </div>

        {/* Main Title */}
        <h1 className="font-sans text-5xl md:text-hero font-bold text-text-primary mb-6 tracking-tight">
          <span className="gradient-text">{t('title')}</span>
        </h1>

        {/* Subtitle with Typewriter Effect */}
        <h2 className="font-sans text-xl md:text-title text-text-secondary mb-8 min-h-[3rem]">
          <Typewriter 
            text={t('subtitle')}
            speed={60}
          />
        </h2>

        {/* Description */}
        <p className="text-body md:text-lg text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
          {t('description')}{' '}
          <span className="gradient-text-primary font-semibold">{t('descriptionHighlight')}</span>
        </p>

        {/* Code Block */}
        <div className="max-w-lg mx-auto">
          <CodeBlock code={[]} />
        </div>
      </Container>
    </section>
  );
}
