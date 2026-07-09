'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { EmptyState, StatusBadge } from '@genie/ui';
import { MOCK_CONVERSATIONS } from '@/lib/mocks/conversations.mock';

export default function AssistantConversationsPage() {
  const params = useParams();
  const conversations = MOCK_CONVERSATIONS.filter((c) => c.assistantId === params.assistantId);

  if (conversations.length === 0) {
    return (
      <EmptyState
        title="No conversations yet"
        description="Conversations will appear here once visitors start chatting with your assistant."
      />
    );
  }

  return (
    <div className="divide-y divide-[var(--border)] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
      {conversations.map((c) => (
        <Link
          key={c.id}
          href={`/conversations?selected=${c.id}`}
          className="flex items-center justify-between px-5 py-4 hover:bg-[var(--surface-secondary)]"
        >
          <div>
            <p className="text-sm font-medium">{c.visitorName}</p>
            <p className="text-xs text-[var(--subtle-foreground)]">{c.lastMessage}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--subtle-foreground)]">
              {new Date(c.updatedAt).toLocaleDateString()}
            </span>
            <StatusBadge status={c.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}
