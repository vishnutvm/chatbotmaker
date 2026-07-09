'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { Button, StatusBadge } from '@genie/ui';
import { getAssistantById } from '@/lib/mocks/assistants.mock';
import { cn } from '@genie/ui';

const TABS = [
  { href: '', label: 'Overview' },
  { href: '/knowledge', label: 'Knowledge' },
  { href: '/instructions', label: 'Instructions' },
  { href: '/appearance', label: 'Appearance' },
  { href: '/actions', label: 'Actions' },
  { href: '/conversations', label: 'Conversations' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/settings', label: 'Settings' },
];

export default function AssistantWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const assistantId = params.assistantId as string;
  const assistant = getAssistantById(assistantId);
  const basePath = `/assistants/${assistantId}`;

  if (!assistant) {
    return (
      <div className="py-12 text-center">
        <p className="text-[var(--muted-foreground)]">Assistant not found.</p>
        <Button variant="secondary" className="mt-4" asChild>
          <Link href="/assistants">Back to Assistants</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-semibold">{assistant.name}</h1>
            <StatusBadge status={assistant.status} />
          </div>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Last updated {new Date(assistant.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" asChild>
            <Link href={`${basePath}/test`}>Test Assistant</Link>
          </Button>
          <Button asChild>
            <Link href={`${basePath}/settings`}>Deploy</Link>
          </Button>
        </div>
      </div>

      <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-[var(--border)]" aria-label="Assistant navigation">
        {TABS.map((tab) => {
          const href = `${basePath}${tab.href}`;
          const isActive =
            tab.href === ''
              ? pathname === basePath
              : pathname.startsWith(href);
          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                'whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
