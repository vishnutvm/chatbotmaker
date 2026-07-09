'use client';

import { MetricCard, PageHeader } from '@genie/ui';
import { MOCK_ANALYTICS } from '@/lib/mocks/analytics.mock';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Understand how your assistants are performing."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Conversations" value={MOCK_ANALYTICS.conversations} />
        <MetricCard label="Messages" value={MOCK_ANALYTICS.messages.toLocaleString()} />
        <MetricCard label="Unique Users" value={MOCK_ANALYTICS.uniqueUsers} />
        <MetricCard label="Resolution Rate" value={`${MOCK_ANALYTICS.resolutionRate}%`} />
        <MetricCard label="AI Usage" value={`${(MOCK_ANALYTICS.aiUsage / 1000).toFixed(1)}k`} />
      </div>

      <div className="mb-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 text-lg font-semibold">Conversation Trends</h2>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MOCK_ANALYTICS.trends}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="mb-4 text-lg font-semibold">Top Topics</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_ANALYTICS.topTopics} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="topic" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366F1" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="mb-4 text-lg font-semibold">Unanswered Questions</h2>
            <ul className="space-y-3">
              {MOCK_ANALYTICS.unansweredQuestions.map((q) => (
                <li key={q.question} className="text-sm">
                  <p className="font-medium">{q.question}</p>
                  <p className="text-xs text-[var(--subtle-foreground)]">Asked {q.count} times</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="mb-4 text-lg font-semibold">Knowledge Gaps</h2>
            <ul className="space-y-2">
              {MOCK_ANALYTICS.knowledgeGaps.map((g) => (
                <li key={g.topic} className="flex items-center justify-between text-sm">
                  <span>{g.topic}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      g.severity === 'high'
                        ? 'bg-[var(--error-subtle)] text-[var(--error)]'
                        : g.severity === 'medium'
                          ? 'bg-[var(--warning-subtle)] text-[var(--warning)]'
                          : 'bg-[var(--surface-elevated)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    {g.severity}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
