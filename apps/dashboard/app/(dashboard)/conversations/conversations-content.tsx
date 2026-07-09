'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import {
  EmptyState,
  PageHeader,
  PageToolbar,
  StatusBadge,
} from '@genie/ui';
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from '@/lib/mocks/conversations.mock';

export default function ConversationsContent() {
  const searchParams = useSearchParams();
  const initialSelected = searchParams.get('selected') ?? MOCK_CONVERSATIONS[0]?.id;
  const [selectedId, setSelectedId] = useState(initialSelected);
  const [filter, setFilter] = useState('all');

  const filtered = MOCK_CONVERSATIONS.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const selected = MOCK_CONVERSATIONS.find((c) => c.id === selectedId);
  const messages = selected ? MOCK_MESSAGES[selected.id] ?? [] : [];

  if (MOCK_CONVERSATIONS.length === 0) {
    return (
      <div>
        <PageHeader title="Conversations" description="View and manage visitor conversations." />
        <EmptyState
          title="No conversations yet"
          description="Conversations will appear here once visitors start chatting with your assistants."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Conversations" description="View and manage visitor conversations." />

      <PageToolbar>
        {['all', 'open', 'assigned', 'unresolved', 'resolved'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
              filter === f
                ? 'bg-[var(--primary-subtle)] text-[var(--primary)]'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-elevated)]'
            }`}
          >
            {f}
          </button>
        ))}
      </PageToolbar>

      <div className="grid h-[calc(100vh-220px)] gap-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] lg:grid-cols-[280px_1fr_260px]">
        <div className="overflow-y-auto border-r border-[var(--border)]">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              className={`w-full border-b border-[var(--border)] px-4 py-3 text-left hover:bg-[var(--surface-secondary)] ${
                selectedId === c.id ? 'bg-[var(--primary-subtle)]' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{c.visitorName}</p>
                <StatusBadge status={c.status} />
              </div>
              <p className="mt-0.5 truncate text-xs text-[var(--subtle-foreground)]">{c.lastMessage}</p>
              <p className="mt-1 text-xs text-[var(--subtle-foreground)]">{c.assistantName}</p>
            </button>
          ))}
        </div>

        <div className="flex flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="border-b border-[var(--border)] px-4 py-3">
                <p className="font-medium">{selected.visitorName}</p>
                <p className="text-xs text-[var(--subtle-foreground)]">{selected.assistantName}</p>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                        m.role === 'user'
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--surface-elevated)]'
                      }`}
                    >
                      <p>{m.content}</p>
                      {m.sources ? (
                        <div className="mt-2 border-t border-[var(--border)] pt-2">
                          <p className="text-xs opacity-70">Sources: {m.sources.join(', ')}</p>
                        </div>
                      ) : null}
                      <p className="mt-1 text-xs opacity-60">
                        {new Date(m.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-[var(--muted-foreground)]">
              Select a conversation
            </div>
          )}
        </div>

        <div className="hidden overflow-y-auto border-l border-[var(--border)] p-4 lg:block">
          {selected ? (
            <div className="space-y-4 text-sm">
              <h3 className="font-semibold">Details</h3>
              <div>
                <p className="text-xs text-[var(--subtle-foreground)]">Assistant</p>
                <p>{selected.assistantName}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--subtle-foreground)]">Status</p>
                <StatusBadge status={selected.status} />
              </div>
              <div>
                <p className="text-xs text-[var(--subtle-foreground)]">Messages</p>
                <p>{selected.messageCount}</p>
              </div>
              {selected.visitorEmail ? (
                <div>
                  <p className="text-xs text-[var(--subtle-foreground)]">Email</p>
                  <p>{selected.visitorEmail}</p>
                </div>
              ) : null}
              <div>
                <p className="text-xs text-[var(--subtle-foreground)]">Started</p>
                <p>{new Date(selected.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
