'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Button,
  Card,
  InsightCard,
  MetricCard,
  StatusBadge,
} from '@genie/ui';
import { getAssistantById } from '@/lib/mocks/assistants.mock';
import { MOCK_KNOWLEDGE_SOURCES } from '@/lib/mocks/knowledge.mock';
import { MOCK_CONVERSATIONS } from '@/lib/mocks/conversations.mock';

const SETUP_STEPS = [
  { label: 'Assistant Created', done: true },
  { label: 'Knowledge Added', done: true },
  { label: 'Assistant Tested', done: true },
  { label: 'Customize Appearance', done: false },
  { label: 'Deploy to Website', done: false },
];

export default function AssistantOverviewPage() {
  const params = useParams();
  const assistant = getAssistantById(params.assistantId as string);
  if (!assistant) return null;

  const knowledge = MOCK_KNOWLEDGE_SOURCES.filter((k) => k.assistantId === assistant.id);
  const conversations = MOCK_CONVERSATIONS.filter((c) => c.assistantId === assistant.id);

  return (
    <div className="space-y-8">
      <Card className="p-5">
        <h2 className="mb-4 text-lg font-semibold">Assistant Setup</h2>
        <ul className="space-y-2">
          {SETUP_STEPS.map((step) => (
            <li key={step.label} className="flex items-center gap-2 text-sm">
              <span className={step.done ? 'text-[var(--success)]' : 'text-[var(--subtle-foreground)]'}>
                {step.done ? '✓' : '○'}
              </span>
              <span className={step.done ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}>
                {step.label}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Conversations" value={assistant.conversationCount} />
        <MetricCard label="Knowledge Sources" value={assistant.knowledgeSourceCount} />
        <MetricCard label="Status" value={assistant.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-semibold">Recent Conversations</h2>
          <Card className="divide-y divide-[var(--border)]">
            {conversations.length === 0 ? (
              <p className="p-5 text-sm text-[var(--muted-foreground)]">No conversations yet.</p>
            ) : (
              conversations.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm font-medium">{c.visitorName}</p>
                    <p className="text-xs text-[var(--subtle-foreground)]">{c.lastMessage}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))
            )}
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold">Knowledge Status</h2>
          <Card className="divide-y divide-[var(--border)]">
            {knowledge.map((k) => (
              <div key={k.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium">{k.name}</p>
                  <p className="text-xs text-[var(--subtle-foreground)]">{k.type}</p>
                </div>
                <StatusBadge status={k.status} />
              </div>
            ))}
          </Card>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Recommendations</h2>
        <div className="space-y-3">
          <InsightCard
            type="warning"
            title="Customize your widget appearance"
            description="Make your assistant match your brand before deploying."
            actionLabel="Customize"
            actionHref={`/assistants/${assistant.id}/appearance`}
          />
          {!assistant.deployed && (
            <InsightCard
              type="success"
              title="Ready to deploy"
              description="Your assistant is configured and ready for your website."
              actionLabel="Deploy"
              actionHref={`/assistants/${assistant.id}/settings`}
            />
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button asChild>
          <Link href={`/assistants/${assistant.id}/test`}>Test Assistant</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href={`/assistants/${assistant.id}/knowledge`}>Add Knowledge</Link>
        </Button>
      </div>
    </div>
  );
}
