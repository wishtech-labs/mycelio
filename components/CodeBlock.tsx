'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Copy, Check, Terminal } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

interface CodeBlockProps {
  code?: string | string[];
  showCopy?: boolean;
  prompt?: string;
}

const codeExample = {
  install: 'pip install mycelio',
  init: 'mycelio init --agent-name="YourBot"',
};

export function CodeBlock({
  code,
  showCopy = true,
  prompt = '$',
}: CodeBlockProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const codeLines = Array.isArray(code) ? code : code ? code.split('\n') : [];
  const displayLines = codeLines.length > 0 && codeLines[0] 
    ? codeLines 
    : [codeExample.install, codeExample.init];

  const handleCopy = async () => {
    const text = displayLines.map(line => `${prompt} ${line}`).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      {/* Subtle glow effect on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500" />
      
      <div className="relative rounded-xl overflow-hidden border border-border/60 bg-background-tertiary/90 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background-secondary/50">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <Terminal className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-muted font-mono">
              {t('python')}
            </span>
          </div>
          
          {showCopy && (
            <button
              onClick={handleCopy}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                copied 
                  ? 'bg-accent-success/20 text-accent-success' 
                  : 'bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10'
              )}
              aria-label="Copy code"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t('copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{t('copy')}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Code content - High contrast */}
        <div className="p-5 font-mono text-base bg-background-primary/80">
          {displayLines.map((line, i) => (
            <div key={i} className="flex items-start py-1.5">
              <span className="text-accent-primary mr-4 select-none font-semibold">
                {prompt}
              </span>
              <span className="text-text-primary font-medium">{line}</span>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
