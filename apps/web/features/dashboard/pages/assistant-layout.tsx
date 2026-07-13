'use client';

import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { TopHeader } from '@/components/shell/TopHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { useAssistant } from '@/lib/store';
import { Bot, PlayCircle, Rocket, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'knowledge', label: 'Knowledge' },
  { id: 'instructions', label: 'Instructions' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'actions', label: 'Actions' },
  { id: 'test', label: 'Test' },
  { id: 'deploy', label: 'Deploy' },
  { id: 'conversations', label: 'Conversations' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
] as const;

export function AssistantWorkspace({ children }: { children: ReactNode }) {
  const params = useParams();
  const id = String(params.assistantId ?? '');
  const a = useAssistant(id);
  const pathname = usePathname();

  if (!a) {
    return <div className="p-12 text-center text-muted-foreground">Assistant not found.</div>;
  }

  return (
    <>
      <TopHeader
        breadcrumb={
          <div className="flex items-center gap-1.5">
            <Link href="/dashboard/assistants" className="hover:text-foreground">
              Assistants
            </Link>
            <span>/</span>
            <span className="text-foreground">{a.name}</span>
          </div>
        }
      />

      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-[1240px] px-6 pt-6 pb-0">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-primary">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-[22px] font-semibold tracking-tight text-foreground">
                    {a.name}
                  </h1>
                  <StatusBadge
                    tone={
                      a.status === 'live' ? 'success' : a.status === 'draft' ? 'neutral' : 'warning'
                    }
                  >
                    {a.status}
                  </StatusBadge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Updated {a.lastUpdated} · {a.conversations.toLocaleString()} conversations
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/assistants/${id}/test">
                  <PlayCircle className="mr-1.5 h-4 w-4" /> Test
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/dashboard/assistants/${id}/deploy">
                  <Rocket className="mr-1.5 h-4 w-4" /> Deploy
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8" aria-label="More">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                  <DropdownMenuItem>Pause</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <TabBar assistantId={a.id} pathname={pathname} />
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-6 py-8">{children}</div>
    </>
  );
}

function TabBar({ assistantId, pathname }: { assistantId: string; pathname: string }) {
  const router = useRouter();
  return (
    <nav className="mt-6 -mb-px flex gap-1 overflow-x-auto" role="tablist">
      {tabs.map((t) => {
        const href = `/dashboard/assistants/${assistantId}/${t.id}`;
        const active = pathname === href;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => router.push(href)}
            className={cn(
              'shrink-0 border-b-2 px-3 py-2.5 text-sm transition-colors',
              active
                ? 'border-primary text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
