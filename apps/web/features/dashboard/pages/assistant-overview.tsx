'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { conversations } from "@/lib/mock/data";
import { useAssistant, useKnowledgeSources } from "@/lib/store";
import { MetricCard } from "@/components/common/MetricCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Check, Circle, ArrowRight, RefreshCw, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";



export default function Overview() {
  const params = useParams(); const id = String(params.assistantId ?? params.id ?? "");
  const a = useAssistant(id);
  const sources = useKnowledgeSources(id);
  const convos = conversations.filter((c) => c.assistantId === id).slice(0, 5);
  if (!a) return null;

  const setup = [
    { label: "Assistant created", done: true },
    { label: "Knowledge added", done: sources.length > 0 },
    { label: "Assistant tested", done: true },
    { label: "Customize appearance", done: false },
    { label: "Deploy to website", done: a.status === "live" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Conversations (30d)" value={a.conversations.toLocaleString()} delta={{ value: "+9%", direction: "up" }} />
        <MetricCard label="Messages" value={a.messages.toLocaleString()} />
        <MetricCard label="Resolution rate" value={`${a.resolutionRate}%`} delta={{ value: "+3pt", direction: "up" }} />
        <MetricCard label="Knowledge sources" value={a.knowledgeSources} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">Recent conversations</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/dashboard/assistants/${id}/conversations`}>View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
              </Button>
            </div>
            <div className="divide-y divide-border">
              {convos.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">No conversations yet.</div>
              ) : convos.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-[11px] font-semibold text-foreground">{c.visitorInitials}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{c.visitor}</span>
                      <StatusBadge tone={c.status === "resolved" ? "success" : c.status === "open" ? "info" : "warning"}>{c.status}</StatusBadge>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{c.lastMessage}</div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">{c.time}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-base font-semibold text-foreground">Knowledge status</h2>
            <div className="mt-3 divide-y divide-border">
              {sources.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.pages} pages · updated {s.updated}</div>
                  </div>
                  <StatusBadge tone={s.status === "ready" ? "success" : s.status === "processing" ? "info" : s.status === "failed" ? "error" : "warning"}>
                    {s.status.replace("_", " ")}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-base font-semibold text-foreground">Assistant setup</h2>
            <ul className="mt-4 space-y-2">
              {setup.map((s) => (
                <li key={s.label} className="flex items-center gap-2.5 text-sm">
                  {s.done ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-success-foreground"><Check className="h-3 w-3" /></div>
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/40" />
                  )}
                  <span className={s.done ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" size="sm" className="mt-5 w-full">Complete setup</Button>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-foreground">Recommendations</h2>
            <div className="mt-3 space-y-3">
              <RecoItem icon={RefreshCw} title="Re-sync pricing.acme.com" desc="Not updated in 14 days." />
              <RecoItem icon={Rocket} title="Ready to deploy" desc="Add the widget to your site." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecoItem({ icon: Icon, title, desc }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-subtle text-primary shrink-0"><Icon className="h-4 w-4" /></div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}
