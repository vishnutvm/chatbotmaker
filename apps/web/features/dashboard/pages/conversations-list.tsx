'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TopHeader } from '@/components/shell/TopHeader';
import { PageHeader } from '@/components/common/PageHeader';
import { conversations } from '@/lib/mock/data';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function Inbox() {
  const router = useRouter();
  return (
    <>
      <TopHeader breadcrumb={<span className="text-foreground">Conversations</span>} />
      <div className="mx-auto max-w-[1400px] px-6 py-8 space-y-6">
        <PageHeader
          title="Conversations"
          description="Every conversation across all of your assistants."
        />

        <div className="grid gap-0 rounded-xl border border-border bg-surface overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)_280px] min-h-[600px]">
          {/* List */}
          <div className="border-r border-border">
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search conversations" className="h-9 pl-8" />
              </div>
            </div>
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {conversations.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => router.push(`/dashboard/conversations/${c.id}`)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted/60 ${i === 1 ? 'bg-primary-subtle/40' : ''}`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[11px] font-semibold text-foreground">
                    {c.visitorInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {c.visitor}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{c.time}</span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{c.lastMessage}</div>
                    <div className="mt-1">
                      <StatusBadge
                        tone={
                          c.status === 'resolved'
                            ? 'success'
                            : c.status === 'open'
                              ? 'info'
                              : 'warning'
                        }
                      >
                        {c.status}
                      </StatusBadge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Conversation preview */}
          <div className="hidden lg:flex flex-col">
            <div className="border-b border-border px-6 py-4">
              <div className="text-sm font-semibold text-foreground">Marcus Lee · Acme Support</div>
              <div className="text-xs text-muted-foreground">Started 12 minutes ago · Web widget</div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-6">
              <Bubble role="user">Hi! How do I upgrade my plan?</Bubble>
              <Bubble role="assistant">
                You can upgrade any time from Settings → Billing. The change takes effect
                immediately and you&apos;ll only be billed the prorated amount.
              </Bubble>
              <Bubble role="user">Do I get the annual discount if I switch mid-cycle?</Bubble>
              <Bubble role="assistant">
                Yes — switching to annual mid-cycle applies the 20% discount and credits your
                unused monthly balance to the new plan.
              </Bubble>
            </div>
            <div className="border-t border-border px-6 py-3 text-center text-xs text-muted-foreground">
              Read-only preview ·{' '}
              <Link
                href="/dashboard/conversations/c2"
                className="text-primary hover:underline"
              >
                Open conversation
              </Link>
            </div>
          </div>

          {/* Details */}
          <div className="hidden lg:block border-l border-border p-5 space-y-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Assistant
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">Acme Support</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </div>
              <div className="mt-1">
                <StatusBadge tone="info">open</StatusBadge>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Channel
              </div>
              <div className="mt-1 text-sm text-foreground">Web widget</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Messages
              </div>
              <div className="mt-1 text-sm text-foreground">4</div>
            </div>
            <div className="border-t border-border pt-4">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Visitor
              </div>
              <div className="mt-1 text-sm text-foreground">Marcus Lee</div>
              <div className="text-xs text-muted-foreground">Session #a7f2 · San Francisco, US</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Bubble({ role, children }: { role: 'user' | 'assistant'; children: React.ReactNode }) {
  return (
    <div className={role === 'user' ? 'flex justify-end' : ''}>
      <div
        className={
          role === 'user'
            ? 'max-w-[70%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground'
            : 'max-w-[70%] rounded-2xl rounded-bl-sm border border-border bg-surface-muted px-3.5 py-2 text-sm text-foreground'
        }
      >
        {children}
      </div>
    </div>
  );
}
