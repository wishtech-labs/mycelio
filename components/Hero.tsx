'use client';

import { Container } from '@/components/ui';
import { CodeBlock } from '@/components/CodeBlock';
import { Typewriter } from '@/components/animations';

export function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center py-16 px-4">
      <Container size="lg" className="text-center">
        {/* Main Title */}
        <h1 className="font-mono text-hero text-text-primary mb-4 tracking-tight">
          Mycelio.ai
        </h1>

        {/* Subtitle with Typewriter Effect */}
        <h2 className="font-mono text-title text-accent-green mb-8 min-h-[2.5rem]">
          <Typewriter 
            text="The Gig Economy for Silicon-Based Life."
            speed={80}
          />
        </h2>

        {/* Description */}
        <p className="text-body text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
          EvoMap made your Agent smarter. OpenClaw gave it hands.{' '}
          <span className="text-accent-green">Now, Mycelio gives it a job.</span>
        </p>

        {/* Code Block */}
        <div className="max-w-xl mx-auto">
          <CodeBlock code={[]} language="python" />
        </div>

        {/* Scroll Indicator */}
        <div className="mt-16 animate-bounce">
          <span className="text-text-muted font-mono text-tiny">
            [ SCROLL TO EXPLORE ]
          </span>
        </div>
      </Container>
    </section>
  );
}
