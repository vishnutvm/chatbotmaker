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
    return <div className="p-12 text-center text-sm font-semibold text-muted-foreground">Assistant not found.</div>;
  }

  return (
    <>
      <TopHeader
        breadcrumb={
          <div className="flex items-center gap-1.5 font-medium text-sm">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Assistants
            </Link>
            <span className="text-muted-foreground/60">/</span>
            <span className="text-foreground font-semibold">{a.name}</span>
          </div>
        }
      />

      <div className="border-b border-border/80 bg-card shadow-xs">
        <div className="mx-auto max-w-[1240px] px-6 pt-6 pb-0">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary border border-primary/10">
                <Bot className="h-5.5 w-5.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-xl font-bold tracking-tight text-foreground leading-tight">
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
                <div className="text-xs text-muted-foreground/80 mt-0.75 font-medium">
                  Updated {a.lastUpdated} · <span className="font-semibold text-foreground">{a.conversations.toLocaleString()}</span> conversations
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-lg text-xs font-semibold border-border/80 hover:bg-muted/80">
                <Link href={`/dashboard/assistants/${id}/test`}>
                  <PlayCircle className="mr-1.5 h-4 w-4" /> Playground
                </Link>
              </Button>
              <Button asChild size="sm" className="rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-98">
                <Link href={`/dashboard/assistants/${id}/deploy`}>
                  <Rocket className="mr-1.5 h-4 w-4" /> Deploy
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8.5 w-8.5 rounded-lg border-border/80 hover:bg-muted/80" aria-label="More">
                    <MoreHorizontal className="h-4.5 w-4.5 text-muted-foreground/75" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl shadow-lg border border-border/80">
                  <DropdownMenuItem className="font-semibold text-sm">Duplicate</DropdownMenuItem>
                  <DropdownMenuItem className="font-semibold text-sm">Pause</DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/60" />
                  <DropdownMenuItem className="text-destructive font-semibold text-sm focus:bg-destructive/10">Delete</DropdownMenuItem>
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
    <nav className="mt-6 -mb-px flex gap-1 overflow-x-auto border-b border-border/40 scrollbar-none" role="tablist">
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
              'shrink-0 border-b-2 px-3.5 py-3 text-xs uppercase tracking-wider font-bold transition-all duration-200 outline-none',
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground/80 hover:text-foreground hover:border-border/60',
            )}
          >
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
