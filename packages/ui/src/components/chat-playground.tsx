'use client';

import * as React from 'react';
import { Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '../lib/utils';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

export function ChatPlayground({
  messages,
  onSend,
  loading = false,
  welcomeMessage = 'Hi! How can I help you today?',
  className,
}: {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  loading?: boolean;
  welcomeMessage?: string;
  className?: string;
}) {
  const [input, setInput] = React.useState('');
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput('');
  }

  const displayMessages =
    messages.length === 0
      ? [{ id: 'welcome', role: 'assistant' as const, content: welcomeMessage }]
      : messages;

  return (
    <div
      className={cn(
        'flex h-full min-h-[400px] flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]',
        className,
      )}
    >
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {displayMessages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-[var(--radius-lg)] px-4 py-2.5 text-sm',
                msg.role === 'user'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface-elevated)] text-[var(--foreground)]',
              )}
            >
              <p>{msg.content}</p>
              {msg.sources && msg.sources.length > 0 ? (
                <div className="mt-2 border-t border-[var(--border)] pt-2">
                  <p className="text-xs text-[var(--subtle-foreground)]">Sources used:</p>
                  <ul className="mt-1 space-y-0.5">
                    {msg.sources.map((source) => (
                      <li key={source} className="text-xs text-[var(--primary)]">
                        {source}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {loading ? (
          <div className="flex justify-start">
            <div className="rounded-[var(--radius-lg)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm text-[var(--subtle-foreground)]">
              Thinking…
            </div>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="border-t border-[var(--border)] p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your assistant a question…"
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
