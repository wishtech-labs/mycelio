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
      {/* Glow effect on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
      
      <div className="relative glass-card rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background-tertiary/50">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-text-muted" />
            <span className="px-3 py-1 text-sm font-medium rounded-md bg-accent-primary/20 text-accent-primary">
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
                  : 'bg-background-primary/50 text-text-muted hover:text-text-primary'
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

        {/* Code content */}
        <div className="p-4 font-mono text-code bg-background-primary/30">
          {displayLines.map((line, i) => (
            <div key={i} className="flex items-start py-1">
              <span className="text-accent-primary mr-3 select-none">{prompt}</span>
              <span className="text-text-primary">{line}</span>
              {i === displayLines.length - 1 && (
                <span className="cursor-blink" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
