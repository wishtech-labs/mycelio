'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';

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
  
  // Use default code examples if no custom code provided
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
    <div className="bg-background-tertiary border border-border overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-border bg-background-secondary px-4 py-2">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('python')}
            className={cn(
              'text-sm font-mono transition-colors',
              activeTab === 'python' 
                ? 'text-accent-green' 
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            Python
          </button>
          <button
            onClick={() => setActiveTab('typescript')}
            className={cn(
              'text-sm font-mono transition-colors',
              activeTab === 'typescript' 
                ? 'text-accent-green' 
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            TypeScript
          </button>
        </div>
        
        {showCopy && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-text-muted hover:text-accent-green transition-colors"
            aria-label="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span className="text-xs">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="text-xs">Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Code content */}
      <div className="p-4 font-mono text-code">
        {(activeTab === language ? displayLines : [codeExamples[activeTab].install, codeExamples[activeTab].init]).map((line, i) => (
          <div key={i} className="flex items-start">
            <span className="text-accent-green mr-2 select-none">{prompt}</span>
            <span className="text-text-primary">{line}</span>
            {i === (activeTab === language ? displayLines.length : 2) - 1 && (
              <span className="cursor-blink ml-1" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
