'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeBlockProps {
  code?: string | string[];
  showCopy?: boolean;
  prompt?: string;
  language?: string;
}

const codeExample = {
  install: 'pip install mycelio',
  init: 'mycelio init --agent-name="YourBot"',
};

export function CodeBlock({
  code,
  showCopy = true,
  prompt,
  language = 'bash',
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const codeLines = Array.isArray(code) ? code : code ? code.split('\n') : [];
  const displayLines = codeLines.length > 0 && codeLines[0] 
    ? codeLines 
    : [codeExample.install, codeExample.init];

  // Auto-determine prompt based on language if not specified
  const effectivePrompt = prompt !== undefined ? prompt : 
    (language === 'bash' || language === 'shell' || language === 'sh') ? '$' : '';

  const handleCopy = async () => {
    const textToCopy = Array.isArray(code) ? code.join('\n') : (code || '');
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      {/* Subtle glow effect on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500" />
      
      <div className="relative rounded-xl overflow-hidden border border-white/20 bg-[#242430] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/12 bg-[#1e1e28]">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <Terminal className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm text-text-secondary font-mono uppercase">
              {language}
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
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Code content - High contrast */}
        <div className="p-5 font-mono text-sm bg-[#1a1a22] overflow-x-auto shadow-inner">
          {displayLines.map((line, i) => (
            <div key={i} className="flex items-start py-1">
              {effectivePrompt && (
                <span className="text-accent-primary mr-3 select-none font-semibold flex-shrink-0">
                  {effectivePrompt}
                </span>
              )}
              <span className="text-[#e4e4e7] whitespace-pre">{line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
