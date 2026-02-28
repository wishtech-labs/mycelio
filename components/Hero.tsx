'use client';

import { Container } from '@/components/ui';
import { NodeNetwork } from '@/components/NodeNetwork';
import { useI18n } from '@/lib/i18n-context';

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative h-screen flex flex-col items-center justify-center px-4 overflow-hidden bg-background-primary dark">
      {/* Background Effects */}
      <NodeNetwork />
      
      {/* Gradient orbs - 增强亮度 */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px] animate-pulse" aria-hidden="true" />
      <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-blue-600/12 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} aria-hidden="true" />
      
      <Container size="lg" className="relative z-10 text-center flex flex-col items-center">
        {/* Badge - 更精致的样式 */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-10 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-400" />
          </span>
          <span className="text-sm text-purple-200 font-medium tracking-wide">{t('badge')}</span>
        </div>

        {/* Main Title - 纯白色更醒目 */}
        <h1 className="font-sans text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-2 tracking-tight">
          {t('title')}
        </h1>
        
        {/* Title Highlight - 高对比度渐变 */}
        <h2 className="font-sans text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-10 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300">
            {t('titleHighlight')}
          </span>
        </h2>

        {/* Subtitle - 提高对比度 */}
        <p className="text-lg md:text-xl text-text-secondary max-w-lg mx-auto mb-12 leading-relaxed">
          {t('subtitle')}
        </p>

        {/* CTA Button - 更现代的样式 */}
        <a 
          href="/docs"
          className="group relative inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-50 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.35)] hover:scale-105 active:scale-95"
        >
          {t('startBtn')}
        </a>
      </Container>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/30 to-transparent" />
      </div>
    </section>
  );
}
