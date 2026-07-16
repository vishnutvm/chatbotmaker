'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { conversations } from '@/lib/mock/data';
import { useAssistantDetail } from '@/features/dashboard/assistant-detail-context';
import { MetricCard } from '@/components/common/MetricCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatRelativeTime } from '@/lib/utils';
import { Check, Circle, ArrowRight, RefreshCw, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Overview() {
  const params = useParams();
  const id = String(params.assistantId ?? params.id ?? '');
  const { assistant: a } = useAssistantDetail();
  const convos = conversations.filter((c) => c.assistantId === id).slice(0, 5);
  if (!a) return null;

  const sources = a.knowledgeSources ?? [];

  const setup = [
    { label: 'Assistant created', done: true },
    { label: 'Knowledge added', done: sources.length > 0 },
    { label: 'Assistant tested', done: a.conversationCount > 0 },
    { label: 'Customize appearance', done: false },
    { label: 'Deploy to website', done: a.status === 'live' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Conversations" value={a.conversationCount.toLocaleString()} />
        <MetricCard label="Knowledge sources" value={a.knowledgeSourceCount} />
        <MetricCard label="Status" value={a.status} />
        <MetricCard label="Last updated" value={formatRelativeTime(a.updatedAt)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Recent Conversations */}
          <div className="rounded-2xl border border-border bg-card shadow-ambient overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
              <h2 className="text-base font-bold text-foreground tracking-tight">Recent conversations</h2>
              <Button asChild variant="ghost" size="sm" className="rounded-lg text-xs font-semibold hover:bg-muted/80">
                <Link href={`/dashboard/assistants/${id}/conversations`} className="flex items-center gap-1">
                  View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
              </Button>
            </div>
            <div className="divide-y divide-border/60">
              {convos.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm font-medium text-muted-foreground/80">No conversations yet.</div>
              ) : convos.map((c) => (
                <div key={c.id} className="flex items-center gap-3.5 px-6 py-4.5 transition-colors hover:bg-muted/10">
                  <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground border border-border/60">{c.visitorInitials}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="truncate text-sm font-semibold text-foreground leading-none">{c.visitor}</span>
                      <StatusBadge tone={c.status === "resolved" ? "success" : c.status === "open" ? "info" : "warning"}>{c.status}</StatusBadge>
                    </div>
                    <div className="truncate text-xs text-muted-foreground/80 font-medium">{c.lastMessage}</div>
                  </div>
                  <div className="text-xs text-muted-foreground/60 font-semibold shrink-0">{c.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Knowledge Status */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-ambient">
            <h2 className="text-base font-bold text-foreground tracking-tight">Knowledge status</h2>
            <div className="mt-4 divide-y divide-border/60">
              {sources.length === 0 ? (
                <div className="py-6 text-center text-sm font-medium text-muted-foreground/80">No knowledge sources yet.</div>
              ) : sources.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{s.name}</div>
                    <div className="text-xs text-muted-foreground/80 mt-0.5 font-medium">Updated {formatRelativeTime(s.lastUpdatedAt)}</div>
                  </div>
                  <StatusBadge tone={s.status === "ready" ? "success" : s.status === "pending" ? "info" : "error"}>
                    {s.status}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Setup Checklist */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-ambient">
            <h2 className="text-base font-bold text-foreground tracking-tight">Assistant setup</h2>
            <ul className="mt-5 space-y-3">
              {setup.map((s) => (
                <li key={s.label} className="flex items-center gap-3 text-sm font-medium">
                  {s.done ? (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground border border-success/10 shadow-2xs"><Check className="h-3 w-3 stroke-[2.5]" /></div>
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-muted-foreground/45 stroke-[1.5]" />
                  )}
                  <span className={s.done ? "text-foreground" : "text-muted-foreground/80"}>{s.label}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="sm" className="mt-6 w-full rounded-xl text-xs font-bold border-border/80 hover:bg-muted/80">
              <Link href={`/dashboard/assistants/${id}/knowledge`}>Complete setup</Link>
            </Button>
          </div>

          {/* Recommendations */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-ambient">
            <h2 className="text-base font-bold text-foreground tracking-tight">Recommendations</h2>
            <div className="mt-5 space-y-4">
              {sources.length === 0 && (
                <RecoItem icon={RefreshCw} title="Add your first source" desc="Teach your assistant from the Knowledge tab." />
              )}
              {a.status !== 'live' && (
                <RecoItem icon={Rocket} title="Ready to deploy" desc="Add the widget to your site." />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecoItem({ icon: Icon, title, desc }: any) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-primary/5 text-primary border border-primary/10 shrink-0"><Icon className="h-4 w-4" /></div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground leading-tight">{title}</div>
        <div className="text-xs text-muted-foreground/80 mt-0.5 font-medium leading-normal">{desc}</div>
      </div>
    </div>
  );
}
