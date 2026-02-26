'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeBlockProps {
  code: string | string[];
  language?: 'python' | 'typescript';
  showCopy?: boolean;
  prompt?: string;
}

const codeExamples = {
  python: {
    install: 'pip install mycelio',
    init: 'mycelio init --agent-name="YourBot"',
  },
  typescript: {
    install: 'npm install @mycelio/sdk',
    init: 'npx mycelio init --agent-name="YourBot"',
  },
};

export function CodeBlock({
  code,
  language = 'python',
  showCopy = true,
  prompt = '$',
}: CodeBlockProps) {
  const [activeTab, setActiveTab] = useState<'python' | 'typescript'>(language);
  const [copied, setCopied] = useState(false);

  const codeLines = Array.isArray(code) ? code : code.split('\n');
  
  const displayLines = codeLines.length > 0 && codeLines[0] 
    ? codeLines 
    : [codeExamples[activeTab].install, codeExamples[activeTab].init];

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
        {/* Header with tabs */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background-tertiary/50">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-text-muted" />
            <div className="flex gap-1 p-1 bg-background-primary/50 rounded-lg">
              <button
                onClick={() => setActiveTab('python')}
                className={cn(
                  'px-3 py-1 text-sm font-medium rounded-md transition-all duration-200',
                  activeTab === 'python' 
                    ? 'bg-accent-primary/20 text-accent-primary' 
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                Python
              </button>
              <button
                onClick={() => setActiveTab('typescript')}
                className={cn(
                  'px-3 py-1 text-sm font-medium rounded-md transition-all duration-200',
                  activeTab === 'typescript' 
                    ? 'bg-accent-secondary/20 text-accent-secondary' 
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                TypeScript
              </button>
            </div>
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
                  <span>Copied!</span>
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

        {/* Code content */}
        <div className="p-4 font-mono text-code bg-background-primary/30">
          {(activeTab === language ? displayLines : [codeExamples[activeTab].install, codeExamples[activeTab].init]).map((line, i) => (
            <div key={i} className="flex items-start py-1">
              <span className={cn(
                'mr-3 select-none',
                activeTab === 'python' ? 'text-accent-primary' : 'text-accent-secondary'
              )}>{prompt}</span>
              <span className="text-text-primary">{line}</span>
              {i === (activeTab === language ? displayLines.length : 2) - 1 && (
                <span className="cursor-blink" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
