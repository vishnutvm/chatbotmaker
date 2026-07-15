'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { TopHeader } from '@/components/shell/TopHeader';
import { messagesById, conversations } from '@/lib/mock/data';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ChevronLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ConvoDetail() {
  const params = useParams();
  const id = String(params.conversationId ?? '');
  const c = conversations.find((x) => x.id === id) ?? conversations[0];
  const msgs = messagesById[id] ?? messagesById.c2;

  return (
    <>
      <TopHeader
        breadcrumb={
          <div className="flex items-center gap-1.5">
            <Link href="/dashboard/conversations" className="hover:text-foreground">
              Conversations
            </Link>
            <span>/</span>
            <span className="text-foreground">{c.visitor}</span>
          </div>
        }
      />
      <div className="mx-auto max-w-[1240px] px-6 py-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/dashboard/conversations">
            <ChevronLeft className="mr-1 h-4 w-4" /> All conversations
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="rounded-xl border border-border bg-surface">
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">{c.visitor}</div>
                <div className="text-xs text-muted-foreground">
                  {c.assistantName} · Web widget
                </div>
              </div>
              <StatusBadge
                tone={
                  c.status === 'resolved' ? 'success' : c.status === 'open' ? 'info' : 'warning'
                }
              >
                {c.status}
              </StatusBadge>
            </div>
            <div className="space-y-4 p-6">
              {msgs.map((m) => (
                <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : ''}>
                  <div className={m.role === 'user' ? 'max-w-[75%]' : 'max-w-[75%]'}>
                    <div
                      className={
                        m.role === 'user'
                          ? 'rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground'
                          : 'rounded-2xl rounded-bl-sm border border-border bg-surface-muted px-4 py-2.5 text-sm text-foreground'
                      }
                    >
                      {m.content}
                    </div>
                    {m.sources && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.sources.map((s) => (
                          <span
                            key={s.url}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] text-muted-foreground"
                          >
                            <FileText className="h-3 w-3" /> {s.title}
                          </span>
                        ))}
                      </div>
                    )}
                    <div
                      className={`mt-1 text-[10px] text-muted-foreground ${m.role === 'user' ? 'text-right' : ''}`}
                    >
                      {m.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 space-y-4 self-start">
            <Detail label="Assistant" value={c.assistantName} />
            <Detail label="Channel" value="Web widget" />
            <Detail label="Messages" value={String(c.messageCount)} />
            <Detail label="Started" value="Today, 10:24" />
            <Detail label="Session" value="#a7f2c1" mono />
          </div>
        </div>
      </div>
    </>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 text-sm text-foreground ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}
