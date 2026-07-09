'use client';

import { useParams } from 'next/navigation';
import { MetricCard } from '@genie/ui';
import { getAssistantById } from '@/lib/mocks/assistants.mock';
import { MOCK_ANALYTICS } from '@/lib/mocks/analytics.mock';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function AssistantAnalyticsPage() {
  const params = useParams();
  const assistant = getAssistantById(params.assistantId as string);
  if (!assistant) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <MetricCard label="Conversations" value={assistant.conversationCount} />
        <MetricCard label="Messages" value={MOCK_ANALYTICS.messages} />
        <MetricCard label="Resolution Rate" value={`${MOCK_ANALYTICS.resolutionRate}%`} />
        <MetricCard label="AI Usage" value={`${(MOCK_ANALYTICS.aiUsage / 1000).toFixed(1)}k tokens`} />
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <h3 className="mb-4 font-semibold">Conversation Trends</h3>
        <div className="h-[240px]">
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
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-5">
          <h3 className="mb-4 font-semibold">Top Topics</h3>
          <ul className="space-y-2">
            {MOCK_ANALYTICS.topTopics.map((t) => (
              <li key={t.topic} className="flex justify-between text-sm">
                <span>{t.topic}</span>
                <span className="text-[var(--subtle-foreground)]">{t.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-5">
          <h3 className="mb-4 font-semibold">Unanswered Questions</h3>
          <ul className="space-y-2">
            {MOCK_ANALYTICS.unansweredQuestions.map((q) => (
              <li key={q.question} className="text-sm">
                <p>{q.question}</p>
                <p className="text-xs text-[var(--subtle-foreground)]">{q.count} times</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
