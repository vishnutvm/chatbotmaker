'use client';

import Link from 'next/link';
import { TopHeader } from '@/components/shell/TopHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { analyticsSeries } from '@/lib/mock/data';
import { useAssistants } from '@/lib/store';
import { useAuth } from '@/providers/auth-provider';
import { greetingForName } from '@/lib/identity';
import {
  ArrowRight,
  Plus,
  BookOpen,
  MessageSquarePlus,
  PlayCircle,
  AlertCircle,
  RefreshCw,
  Rocket,
  Zap,
  Sparkles,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const assistants = useAssistants();
  const totalConvos = assistants.reduce((a, b) => a + b.conversations, 0);
  const totalMsgs = assistants.reduce((a, b) => a + b.messages, 0);
  const totalSources = assistants.reduce((a, b) => a + b.knowledgeSources, 0);
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <>
      <TopHeader breadcrumb={<span className="text-foreground/80">Home</span>} />
      <div
        className="mx-auto max-w-[1280px] px-6 py-8 space-y-6"
        data-testid="dashboard-welcome"
      >
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              {greetingForName(user?.name)}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Here&apos;s what happened with your assistants today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="grid h-8 w-8 place-items-center rounded-full border-2 border-background bg-primary text-[10px] font-semibold text-primary-foreground">
                {initials}
              </div>
              <div className="grid h-8 w-8 place-items-center rounded-full border-2 border-background bg-success text-[10px] font-semibold text-success-foreground">
                ML
              </div>
            </div>
            <Button asChild className="h-10 rounded-xl shadow-lg shadow-primary/30">
              <Link href="/dashboard/assistants/new/create">
                <Plus className="mr-1.5 h-4 w-4" /> Create assistant
              </Link>
            </Button>
          </div>
        </header>

        {/* Metric bento — 4 tiles */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricTile label="Total assistants" value={assistants.length.toString()} delta="+1" tone="up" />
          <MetricTile
            label="Conversations"
            value={totalConvos.toLocaleString()}
            delta="+12%"
            tone="up"
          />
          <MetricTile label="Messages" value={totalMsgs.toLocaleString()} delta="+8%" tone="up" />
          <MetricTile
            label="Knowledge sources"
            value={totalSources.toString()}
            delta="synced 2h ago"
            tone="neutral"
          />
        </div>

        {/* Chart + Quick actions */}
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="glass-card lg:col-span-8 p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-foreground">Assistant activity</h2>
                <p className="text-xs text-muted-foreground">Conversations across all assistants</p>
              </div>
              <div className="flex gap-1 rounded-xl border border-border bg-background/40 p-1">
                {['7d', '30d', '90d'].map((r, i) => (
                  <button
                    key={r}
                    type="button"
                    className={`h-7 rounded-lg px-3 text-xs font-medium transition-colors ${
                      i === 1
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsSeries} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-foreground)',
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="conversations"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#g1)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4">
            <Link
              href="/dashboard/assistants/new/create"
              className="group relative overflow-hidden rounded-3xl border border-primary/30 bg-primary/10 p-6 transition-all hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/30 blur-3xl" />
              <div className="relative">
                <Zap className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-heading font-bold text-foreground">Create assistant</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Spin up a new agent in under a minute.
                </p>
                <div className="mt-4 flex justify-end">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/20 transition-colors group-hover:bg-primary">
                    <ArrowRight className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              </div>
            </Link>
            <div className="glass-card flex-1 p-5">
              <h3 className="font-heading font-bold text-foreground">Quick access</h3>
              <div className="mt-3 space-y-1">
                <QuickAction
                  href="/dashboard/assistants/acme-support/knowledge"
                  icon={BookOpen}
                  label="Add knowledge"
                  tone="info"
                />
                <QuickAction
                  href="/dashboard/assistants/acme-support/test"
                  icon={PlayCircle}
                  label="Test assistant"
                  tone="success"
                />
                <QuickAction
                  href="/dashboard/conversations"
                  icon={MessageSquarePlus}
                  label="View conversations"
                  tone="warning"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Assistants + Insights */}
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="glass-card lg:col-span-7 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-foreground">Your assistants</h2>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary hover:bg-primary/10"
              >
                <Link href="/dashboard/assistants">
                  View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <div className="space-y-2.5">
              {assistants.slice(0, 4).map((a, i) => {
                const tones = [
                  'bg-primary/20 text-primary',
                  'bg-success/20 text-success',
                  'bg-warning/20 text-warning',
                  'bg-info/20 text-info',
                ];
                return (
                  <Link
                    key={a.id}
                    href={`/dashboard/assistants/${a.id}/overview`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background/30 p-3 transition-all hover:border-primary/40 hover:bg-background/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-heading font-bold ${tones[i % tones.length]}`}
                      >
                        {a.name[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">{a.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {a.conversations.toLocaleString()} conversations · {a.knowledgeSources}{' '}
                          sources
                        </div>
                      </div>
                    </div>
                    <StatusBadge
                      tone={
                        a.status === 'live' ? 'success' : a.status === 'draft' ? 'neutral' : 'warning'
                      }
                    >
                      {a.status}
                    </StatusBadge>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-surface/40 to-transparent p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-bold text-foreground">Actionable insights</h2>
            </div>
            <div className="space-y-3">
              <Insight
                icon={AlertCircle}
                tone="warning"
                title="12 questions couldn't be answered"
                desc="Review unanswered questions and add missing knowledge."
              />
              <Insight
                icon={RefreshCw}
                tone="info"
                title="Website knowledge synced 14d ago"
                desc="Re-index pricing.acme.com to keep answers current."
              />
              <Insight
                icon={Rocket}
                tone="primary"
                title="Docs Guide is ready to deploy"
                desc="Ship it to your docs site."
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MetricTile({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: 'up' | 'neutral';
}) {
  return (
    <div className="glass-card relative overflow-hidden p-5">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div className="font-heading text-3xl font-bold tracking-tight text-foreground leading-none">
          {value}
        </div>
        <span
          className={`text-xs font-medium ${tone === 'up' ? 'text-success' : 'text-muted-foreground'}`}
        >
          {delta}
        </span>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  tone,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: 'info' | 'success' | 'warning';
}) {
  const tones = {
    info: 'bg-info/20 text-info',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
  };
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-background/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className={`grid h-9 w-9 place-items-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
    </Link>
  );
}

function Insight({
  icon: Icon,
  tone,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: 'warning' | 'info' | 'primary';
  title: string;
  desc: string;
}) {
  const borders = {
    warning: 'border-l-warning',
    info: 'border-l-info',
    primary: 'border-l-primary',
  };
  return (
    <div className={`rounded-xl border-l-2 bg-background/30 p-3 ${borders[tone]}`}>
      <div className="flex items-start gap-2">
        <Icon
          className={`mt-0.5 h-4 w-4 shrink-0 ${
            tone === 'warning' ? 'text-warning' : tone === 'info' ? 'text-info' : 'text-primary'
          }`}
        />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
    </div>
  );
}
