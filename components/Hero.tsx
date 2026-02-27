'use client';

import { Container } from '@/components/ui';
import { Typewriter } from '@/components/animations';
import { NodeNetwork } from '@/components/NodeNetwork';
import { useI18n } from '@/lib/i18n-context';

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-20 px-4 overflow-hidden bg-background-primary dark">
      {/* Background Effects */}
      <NodeNetwork />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse" aria-hidden="true" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} aria-hidden="true" />
      
      <Container size="lg" className="relative z-10 text-center flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-10 rounded-full border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors shadow-lg shadow-purple-500/10">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500" />
          </span>
          <span className="text-sm text-text-secondary font-medium tracking-wide uppercase">{t('badge')}</span>
        </div>

        {/* Main Title */}
        <h1 className="font-sans text-6xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 mb-6 tracking-tighter">
          {t('title')}<br />
          <span className="bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">{t('titleHighlight')}</span>
        </h1>

        {/* Subtitle with Typewriter Effect */}
        <h2 className="font-sans text-2xl md:text-3xl text-text-secondary mb-8 min-h-[3rem] font-light tracking-tight">
          <Typewriter 
            text={t('subtitle')}
            speed={40}
          />
        </h2>

        {/* Description */}
        <p className="text-base md:text-lg text-text-muted max-w-2xl mx-auto mb-12 leading-relaxed">
          {t('description')}{' '}
          <span className="text-text-secondary font-semibold ml-1">{t('descriptionHighlight')}</span>{' '}
          {t('descriptionEnd')}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <a 
            href="https://github.com/wishtech-labs/mycelio-hub"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] cursor-pointer"
          >
            {t('startBtn')}
          </a>
          <a 
            href="/docs"
            className="px-8 py-4 rounded-full bg-transparent border border-white/20 text-white font-semibold text-sm hover:bg-white/5 transition-colors cursor-pointer"
          >
            {t('readDocs')}
          </a>
        </div>
      </Container>
    </section>
  );
}
