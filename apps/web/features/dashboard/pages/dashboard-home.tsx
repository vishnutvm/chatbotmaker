'use client';

import Link from 'next/link';
import { TopHeader } from '@/components/shell/TopHeader';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricCard } from "@/components/common/MetricCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { analyticsSeries } from "@/lib/mock/data";
import { useAssistants } from "@/lib/store";
import { useAuth } from '@/providers/auth-provider';
import { greetingForName } from '@/lib/identity';
import {
  ArrowRight,
  Bot,
  Plus,
  BookOpen,
  MessageSquarePlus,
  PlayCircle,
  AlertCircle,
  RefreshCw,
  Rocket,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";



export default function Dashboard() {
  const { user } = useAuth();
  const assistants = useAssistants();
  const totalConvos = assistants.reduce((a, b) => a + b.conversations, 0);
  const totalMsgs = assistants.reduce((a, b) => a + b.messages, 0);
  const totalSources = assistants.reduce((a, b) => a + b.knowledgeSources, 0);

  return (
    <>
      <TopHeader breadcrumb={<span className="text-foreground">Home</span>} />
      <div className="mx-auto max-w-[1240px] px-6 py-8 space-y-8" data-testid="dashboard-welcome">
        <PageHeader
          title={greetingForName(user?.name)}
          description="Here's what's happening with your AI assistants today."
          actions={
            <Button asChild size="lg" className="h-10">
              <Link href="/dashboard/assistants/new/create">
                <Plus className="mr-1.5 h-4 w-4" /> Create assistant
              </Link>
            </Button>
          }
        />

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="Total assistants" value={assistants.length} delta={{ value: "+1", direction: "up" }} hint="1 in draft" />
          <MetricCard label="Conversations" value={totalConvos.toLocaleString()} delta={{ value: "+12%", direction: "up" }} hint="vs. last 30 days" />
          <MetricCard label="Messages" value={totalMsgs.toLocaleString()} delta={{ value: "+8%", direction: "up" }} />
          <MetricCard label="Knowledge sources" value={totalSources} hint="Last synced 2h ago" />
        </div>

        {/* Chart + Quick actions */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Assistant activity</h2>
                <p className="text-xs text-muted-foreground">Conversations across all assistants</p>
              </div>
              <div className="flex gap-1 rounded-md bg-surface-muted p-0.5">
                {["7 days", "30 days", "90 days"].map((r, i) => (
                  <button
                    key={r}
                    className={`h-7 rounded px-2.5 text-xs font-medium ${i === 1 ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsSeries} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                  <Area type="monotone" dataKey="conversations" stroke="var(--color-primary)" strokeWidth={2} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-base font-semibold text-foreground">Quick actions</h2>
            <div className="mt-4 space-y-1.5">
              <QuickAction href="/dashboard/assistants/acme-support/knowledge" icon={BookOpen} label="Add knowledge" />
              <QuickAction href="/dashboard/assistants/acme-support/test" icon={PlayCircle} label="Test assistant" />
              <QuickAction href="/dashboard/conversations" icon={MessageSquarePlus} label="View conversations" />
            </div>
          </div>
        </div>

        {/* Your assistants */}
        <div className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">Your assistants</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/assistants">View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {assistants.slice(0, 4).map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/assistants/${a.id}/overview`}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-muted/60"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{a.name}</span>
                    <StatusBadge tone={a.status === "live" ? "success" : a.status === "draft" ? "neutral" : "warning"}>
                      {a.status}
                    </StatusBadge>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">{a.description}</div>
                </div>
                <div className="hidden md:grid grid-cols-3 gap-6 text-xs text-muted-foreground">
                  <div><div className="font-medium text-foreground">{a.conversations.toLocaleString()}</div><div>conversations</div></div>
                  <div><div className="font-medium text-foreground">{a.knowledgeSources}</div><div>sources</div></div>
                  <div><div className="font-medium text-foreground">{a.lastUpdated}</div><div>updated</div></div>
                </div>
                <ArrowRight className="hidden h-4 w-4 text-muted-foreground sm:block" />
              </Link>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-base font-semibold text-foreground">Actionable insights</h2>
          <p className="text-xs text-muted-foreground">Things that need your attention this week.</p>
          <div className="mt-4 divide-y divide-border">
            <Insight
              icon={AlertCircle}
              tone="warning"
              title="12 questions couldn't be answered"
              desc="Review recent unanswered questions and add missing knowledge."
              cta="Review questions"
            />
            <Insight
              icon={RefreshCw}
              tone="info"
              title="Website knowledge last synced 14 days ago"
              desc="Re-index pricing.acme.com to keep answers current."
              cta="Re-sync now"
            />
            <Insight
              icon={Rocket}
              tone="primary"
              title="Docs Guide is ready to deploy"
              desc="You've tested this assistant. Ship it to your docs site."
              cta="Deploy assistant"
            />
          </div>
        </div>
      </div>
    </>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md border border-transparent px-2.5 py-2.5 text-sm text-foreground transition-colors hover:border-border hover:bg-surface-muted"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-muted text-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <span className="flex-1 font-medium">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
    </Link>
  );
}

function Insight({ icon: Icon, tone, title, desc, cta }: { icon: any; tone: "warning" | "info" | "primary"; title: string; desc: string; cta: string }) {
  const toneMap = { warning: "text-warning bg-warning-subtle", info: "text-info bg-info-subtle", primary: "text-primary bg-primary-subtle" };
  return (
    <div className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneMap[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Button variant="outline" size="sm" className="shrink-0">{cta}</Button>
    </div>
  );
}
