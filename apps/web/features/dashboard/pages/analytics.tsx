'use client';

import { TopHeader } from '@/components/shell/TopHeader';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { analyticsSeries, topTopics, unansweredQuestions, assistants } from '@/lib/mock/data';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

export default function AnalyticsPage() {
  return (
    <>
      <TopHeader breadcrumb={<span className="text-foreground">Analytics</span>} />
      <div className="mx-auto max-w-[1240px] px-6 py-8 space-y-6">
        <PageHeader title="Analytics" description="Understand how your assistants are performing." />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <MetricCard label="Conversations" value="1,713" delta={{ value: '+12%', direction: 'up' }} />
          <MetricCard label="Messages" value="10,803" delta={{ value: '+8%', direction: 'up' }} />
          <MetricCard label="Unique users" value="864" delta={{ value: '+4%', direction: 'up' }} />
          <MetricCard
            label="Resolution rate"
            value="78%"
            delta={{ value: '+2pt', direction: 'up' }}
          />
          <MetricCard label="AI usage" value="1.9M tok" hint="63% of monthly limit" />
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-base font-semibold text-foreground">Conversation trends</h2>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsSeries}>
                <defs>
                  <linearGradient id="ga2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
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
                    borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="conversations"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#ga2)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-base font-semibold text-foreground">Top assistants</h2>
            <div className="mt-4 divide-y divide-border">
              {assistants.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-foreground">{a.name}</span>
                  <span className="text-muted-foreground">
                    {a.conversations.toLocaleString()} convos
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-base font-semibold text-foreground">Most asked topics</h2>
            <div className="mt-4 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTopics} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="topic"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: 'var(--color-foreground)' }}
                    width={140}
                  />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-base font-semibold text-foreground">Knowledge gaps</h2>
          <p className="text-xs text-muted-foreground">
            Questions your assistants couldn&apos;t answer confidently.
          </p>
          <ul className="mt-3 divide-y divide-border">
            {unansweredQuestions.map((q, i) => (
              <li key={i} className="flex items-center justify-between py-3 text-sm">
                <span className="text-foreground">{q}</span>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:text-primary-hover"
                >
                  Add knowledge
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
