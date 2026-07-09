'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from './ui/button';

export function CodeSnippet({ code, language = 'html' }: { code: string; language?: string }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-secondary)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
        <span className="text-xs font-medium text-[var(--subtle-foreground)]">{language}</span>
        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 gap-1.5">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy Code'}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-[var(--foreground)]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
