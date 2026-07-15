'use client';

/**
 * Deferred (post-MVP): metrics Home (activity chart, totals, actionable insights).
 * Canonical signed-in home is Assistants at `/dashboard` — see `assistants-list.tsx`.
 */

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
      <TopHeader breadcrumb={<span className="text-foreground font-semibold">Home</span>} />
      <div className="mx-auto max-w-[1240px] px-6 py-8 space-y-8 animate-in fade-in duration-300" data-testid="dashboard-welcome">
        <PageHeader
          title={greetingForName(user?.name)}
          description="Here's what's happening with your AI assistants today."
          actions={
            <Button asChild size="lg" className="h-10 rounded-xl font-bold shadow-md shadow-primary/10 transition-all hover:shadow-lg active:scale-98">
              <Link href="/dashboard/assistants/new/create">
                <Plus className="mr-1.5 h-4 w-4 stroke-[2.5]" /> Create assistant
              </Link>
            </Button>
          }
        />

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="Total assistants" value={assistants.length} delta={{ value: "+1", direction: "up" }} hint="1 in draft" />
          <MetricCard label="Conversations" value={totalConvos.toLocaleString()} delta={{ value: "+12%", direction: "up" }} hint="vs. last 30 days" />
          <MetricCard label="Messages" value={totalMsgs.toLocaleString()} delta={{ value: "+8%", direction: "up" }} />
          <MetricCard label="Knowledge sources" value={totalSources} hint="Last synced 2h ago" />
        </div>

        {/* Chart + Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-ambient">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground tracking-tight">Assistant activity</h2>
                <p className="text-xs text-muted-foreground font-medium">Conversations across all assistants</p>
              </div>
              <div className="flex gap-1 rounded-lg bg-muted/65 p-0.75">
                {["7 days", "30 days", "90 days"].map((r, i) => (
                  <button
                    key={r}
                    className={`h-7 rounded-md px-3 text-xs font-semibold transition-all ${i === 1 ? "bg-surface text-foreground shadow-xs border border-border/20 font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-8 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsSeries} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.16} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontWeight: 500 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontWeight: 500 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.04)", fontSize: 12 }} />
                  <Area type="monotone" dataKey="conversations" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-ambient">
            <h2 className="text-base font-bold text-foreground tracking-tight">Quick actions</h2>
            <div className="mt-5 space-y-2">
              <QuickAction href="/dashboard/assistants/acme-support/knowledge" icon={BookOpen} label="Add knowledge" />
              <QuickAction href="/dashboard/assistants/acme-support/test" icon={PlayCircle} label="Test assistant" />
              <QuickAction href="/dashboard/conversations" icon={MessageSquarePlus} label="View conversations" />
            </div>
          </div>
        </div>

        {/* Your Assistants List */}
        <div className="rounded-2xl border border-border bg-card shadow-ambient overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/80 px-6 py-4.5">
            <h2 className="text-base font-bold text-foreground tracking-tight">Your assistants</h2>
            <Button asChild variant="ghost" size="sm" className="rounded-lg text-xs font-semibold hover:bg-muted/80">
              <Link href="/dashboard/assistants" className="flex items-center gap-1">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
          <div className="divide-y divide-border/60">
            {assistants.slice(0, 4).map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/assistants/${a.id}/overview`}
                className="group flex items-center gap-4 px-6 py-4.5 transition-all hover:bg-muted/20"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary border border-primary/10 transition-transform group-hover:scale-105">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{a.name}</span>
                    <StatusBadge tone={a.status === "live" ? "success" : a.status === "draft" ? "neutral" : "warning"}>
                      {a.status}
                    </StatusBadge>
                  </div>
                  <div className="mt-0.75 truncate text-xs text-muted-foreground/80 font-medium">{a.description}</div>
                </div>
                <div className="hidden md:grid grid-cols-3 gap-6 text-[11px] text-muted-foreground/70 font-semibold text-right sm:text-left pr-4">
                  <div><div className="text-sm font-bold text-foreground leading-none mb-0.5">{a.conversations.toLocaleString()}</div><div>conversations</div></div>
                  <div><div className="text-sm font-bold text-foreground leading-none mb-0.5">{a.knowledgeSources}</div><div>sources</div></div>
                  <div><div className="text-sm font-bold text-foreground leading-none mb-0.5">{a.lastUpdated.split(',')[0]}</div><div>updated</div></div>
                </div>
                <ArrowRight className="hidden h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 sm:block" />
              </Link>
            ))}
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
      className="group flex items-center gap-3.5 rounded-xl border border-border/40 bg-muted/20 px-3.5 py-3 text-sm text-foreground transition-all hover:border-primary/20 hover:bg-primary/3"
    >
      <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-card text-muted-foreground/80 border border-border/80 shadow-2xs group-hover:text-primary group-hover:border-primary/20">
        <Icon className="h-4 w-4" />
      </div>
      <span className="flex-1 font-semibold text-[13px]">{label}</span>
      <ArrowRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

