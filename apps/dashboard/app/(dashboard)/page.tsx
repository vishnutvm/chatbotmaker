'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  MessageSquare,
  Palette,
  Play,
  Rocket,
  Sparkles,
} from 'lucide-react';
import {
  Button,
  Card,
  InsightCard,
  MetricCard,
  PageHeader,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@genie/ui';
import { getAssistants, hasAssistants } from '@/lib/mocks/assistants.mock';
import { MOCK_INSIGHTS, MOCK_METRICS, MOCK_TRENDS } from '@/lib/mocks/analytics.mock';
import { MOCK_CONVERSATIONS } from '@/lib/mocks/conversations.mock';
import { useAuth } from '@/lib/providers/auth-provider';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const JOURNEY_STEPS = [
  { label: 'Create', icon: Sparkles },
  { label: 'Teach', icon: BookOpen },
  { label: 'Customize', icon: Palette },
  { label: 'Test', icon: Play },
  { label: 'Deploy', icon: Rocket },
];

function FirstTimeDashboard() {
  return (
    <div className="mx-auto max-w-3xl py-8 text-center" data-testid="dashboard-welcome">
      <h1 className="text-[32px] font-semibold text-[var(--foreground)]">
        Welcome to Genie
      </h1>
      <p className="mt-3 text-base text-[var(--muted-foreground)]">
        Create and deploy your first AI assistant in minutes.
      </p>

      <div className="mt-10 flex items-center justify-center gap-2">
        {JOURNEY_STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-subtle)] text-[var(--primary)]">
                <step.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-[var(--muted-foreground)]">{step.label}</span>
            </div>
            {i < JOURNEY_STEPS.length - 1 ? (
              <ArrowRight className="mb-5 h-4 w-4 text-[var(--border-strong)]" />
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button size="lg" asChild>
          <Link href="/assistants/new/create">Create Your First Assistant</Link>
        </Button>
        <Button variant="secondary" size="lg">
          Watch Quick Demo
        </Button>
        <Button variant="ghost" size="lg">
          View Example Assistant
        </Button>
      </div>
    </div>
  );
}

function OperationalDashboard({ userName }: { userName?: string }) {
  const assistants = getAssistants();
  const greeting = userName ? `Good morning, ${userName.split(' ')[0]}` : 'Good morning';

  return (
    <div data-testid="dashboard-welcome">
      <PageHeader
        title={greeting}
        description="Here's what's happening with your AI assistants."
        action={
          <Button asChild>
            <Link href="/assistants/new/create">Create Assistant</Link>
          </Button>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Assistants" value={MOCK_METRICS.totalAssistants} change={MOCK_METRICS.assistantsChange} />
        <MetricCard label="Conversations" value={MOCK_METRICS.conversations} change={MOCK_METRICS.conversationsChange} />
        <MetricCard label="Messages" value={MOCK_METRICS.messages.toLocaleString()} change={MOCK_METRICS.messagesChange} />
        <MetricCard label="Knowledge Sources" value={MOCK_METRICS.knowledgeSources} change={MOCK_METRICS.knowledgeChange} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Conversation Activity</h2>
            <div className="flex gap-1">
              {['7 Days', '30 Days', '90 Days'].map((period, i) => (
                <button
                  key={period}
                  type="button"
                  className={`rounded-md px-3 py-1 text-xs font-medium ${
                    i === 1
                      ? 'bg-[var(--primary-subtle)] text-[var(--primary)]'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-elevated)]'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_TRENDS}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Create Assistant', href: '/assistants/new/create', icon: Sparkles },
              { label: 'Add Knowledge', href: '/assistants/asst-1/knowledge', icon: BookOpen },
              { label: 'Test Assistant', href: '/assistants/asst-1/test', icon: Play },
              { label: 'View Conversations', href: '/conversations', icon: MessageSquare },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-secondary)]"
              >
                <action.icon className="h-4 w-4 text-[var(--primary)]" />
                {action.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Your Assistants</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assistant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Conversations</TableHead>
                <TableHead>Knowledge</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {assistants.map((a) => (
                <TableRow key={a.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/assistants/${a.id}`} className="block">
                      <p className="font-medium text-[var(--foreground)]">{a.name}</p>
                      <p className="text-xs text-[var(--subtle-foreground)]">{a.description}</p>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                  <TableCell>{a.conversationCount}</TableCell>
                  <TableCell>{a.knowledgeSourceCount}</TableCell>
                  <TableCell className="text-[var(--subtle-foreground)]">
                    {new Date(a.lastActivityAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/assistants/${a.id}`}>Manage</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-semibold">Recent Conversations</h2>
          <Card className="divide-y divide-[var(--border)]">
            {MOCK_CONVERSATIONS.slice(0, 3).map((c) => (
              <Link
                key={c.id}
                href={`/conversations?selected=${c.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-[var(--surface-secondary)]"
              >
                <div>
                  <p className="text-sm font-medium">{c.visitorName}</p>
                  <p className="text-xs text-[var(--subtle-foreground)]">{c.lastMessage}</p>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            ))}
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold">Actionable Insights</h2>
          <div className="space-y-3">
            {MOCK_INSIGHTS.map((insight) => (
              <InsightCard key={insight.id} {...insight} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const showOperational = hasAssistants();

  return showOperational ? (
    <OperationalDashboard userName={user?.name} />
  ) : (
    <FirstTimeDashboard />
  );
}
