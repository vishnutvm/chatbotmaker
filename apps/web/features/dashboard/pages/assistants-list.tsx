'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createAssistantsClient } from '@genie/api-client';
import type { AssistantDto } from '@genie/types';
import { getAccessToken, getApiBaseUrl } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { TopHeader } from '@/components/shell/TopHeader';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatRelativeTime } from '@/lib/utils';
import { Bot, Plus, Search, MoreHorizontal, Loader2, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const statusTone = { live: 'success', draft: 'neutral', paused: 'warning', processing: 'info' } as const;

export default function AssistantsList() {
  const { activeOrg } = useAuth();
  const orgId = activeOrg?.id ?? null;
  const router = useRouter();
  const [assistants, setAssistants] = useState<AssistantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [sort, setSort] = useState<string>('updated');

  const load = useCallback(async () => {
    if (!orgId) {
      setAssistants([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const client = createAssistantsClient(getApiBaseUrl());
      const res = await client.list(token, orgId);
      setAssistants(res.assistants);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load assistants');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(assistant: AssistantDto) {
    if (!orgId) return;
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const client = createAssistantsClient(getApiBaseUrl());
      await client.delete(token, orgId, assistant.id);
      setAssistants((list) => list.filter((a) => a.id !== assistant.id));
      toast.success(`Deleted ${assistant.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete this assistant');
    }
  }

  const filtered = useMemo(() => {
    let list = assistants.slice();
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q),
      );
    }
    if (status !== 'all') list = list.filter((a) => a.status === status);
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'convos') list.sort((a, b) => b.conversationCount - a.conversationCount);
    return list;
  }, [assistants, query, status, sort]);

  return (
    <>
      <TopHeader breadcrumb={<span className="text-foreground">Assistants</span>} />
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 py-8 space-y-6">
        <PageHeader
          title="Assistants"
          description="Create, configure, test and deploy your AI assistants."
          actions={
            <Button asChild size="lg" className="h-10">
              <Link href="/dashboard/assistants/new/create">
                <Plus className="mr-1.5 h-4 w-4" /> Create assistant
              </Link>
            </Button>
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search assistants"
              className="h-9 pl-8"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-full sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-9 w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Sort by last updated</SelectItem>
              <SelectItem value="name">Sort by name</SelectItem>
              <SelectItem value="convos">Sort by conversations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface py-16 text-sm font-medium text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading assistants…
          </div>
        ) : error ? (
          <EmptyState
            icon={AlertCircle}
            title="Could not load assistants"
            description={error}
            action={
              <Button variant="outline" onClick={() => void load()}>
                Try again
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Bot}
            title={assistants.length === 0 ? 'No assistants yet' : 'No assistants match your filters'}
            description={
              assistants.length === 0
                ? 'Create your first assistant in under 2 minutes.'
                : 'Try clearing the search or status filter.'
            }
            action={
              assistants.length === 0 ? (
                <Button asChild>
                  <Link href="/dashboard/assistants/new/create">
                    <Plus className="mr-1.5 h-4 w-4" /> Create assistant
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('');
                    setStatus('all');
                  }}
                >
                  Clear filters
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-border bg-surface">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-muted/60 text-left text-xs font-medium text-muted-foreground">
                    <th className="px-5 py-2.5">Assistant</th>
                    <th className="px-5 py-2.5">Status</th>
                    <th className="hidden lg:table-cell px-5 py-2.5">Knowledge</th>
                    <th className="px-5 py-2.5">Conversations</th>
                    <th className="hidden lg:table-cell px-5 py-2.5">Last updated</th>
                    <th className="px-5 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((a) => (
                    <tr
                      key={a.id}
                      className="group cursor-pointer transition-colors hover:bg-surface-muted/40"
                      onClick={() => router.push(`/dashboard/assistants/${a.id}/overview`)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                              {a.name}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {a.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge tone={statusTone[a.status] ?? 'neutral'}>{a.status}</StatusBadge>
                      </td>
                      <td className="hidden lg:table-cell px-5 py-3.5 text-sm text-foreground">
                        {a.knowledgeSourceCount} sources
                      </td>
                      <td className="px-5 py-3.5 text-sm text-foreground">
                        {a.conversationCount.toLocaleString()}
                      </td>
                      <td className="hidden lg:table-cell px-5 py-3.5 text-sm text-muted-foreground">
                        {formatRelativeTime(a.updatedAt)}
                      </td>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/dashboard/assistants/${a.id}/overview`)}
                            >
                              Open
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => void handleDelete(a)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <div className="md:hidden space-y-2">
              {filtered.map((a) => (
                <Link
                  key={a.id}
                  href={`/dashboard/assistants/${a.id}/overview`}
                  className="block rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-sm font-medium text-foreground">{a.name}</div>
                        <StatusBadge tone={statusTone[a.status] ?? 'neutral'}>{a.status}</StatusBadge>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {a.description}
                      </div>
                      <div className="mt-2 flex gap-4 text-[11px] text-muted-foreground">
                        <span>
                          <b className="font-medium text-foreground">
                            {a.conversationCount.toLocaleString()}
                          </b>{' '}
                          conversations
                        </span>
                        <span>
                          <b className="font-medium text-foreground">{a.knowledgeSourceCount}</b> sources
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
