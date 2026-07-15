'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { TopHeader } from "@/components/shell/TopHeader";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteAssistant, useAssistants } from "@/lib/store";
import { Bot, Plus, Search, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function AssistantsList() {
  const assistants = useAssistants();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [sort, setSort] = useState<string>("updated");

  const filtered = useMemo(() => {
    let list = assistants.slice();
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
    }
    if (status !== "all") list = list.filter((a) => a.status === status);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "convos") list.sort((a, b) => b.conversations - a.conversations);
    return list;
  }, [assistants, query, status, sort]);

  return (
    <>
      <TopHeader breadcrumb={<span className="text-foreground font-semibold">Assistants</span>} />
      <div
        className="mx-auto max-w-[1240px] px-4 sm:px-6 py-8 space-y-6 animate-in fade-in duration-300"
        data-testid="dashboard-welcome"
      >
        <PageHeader
          title="Assistants"
          description="Create, configure, test and deploy your AI assistants."
          actions={
            <Button asChild size="lg" className="h-10 rounded-xl font-bold shadow-md shadow-primary/10 transition-all hover:shadow-lg active:scale-98">
              <Link href="/dashboard/assistants/new/create">
                <Plus className="mr-1.5 h-4 w-4 stroke-[2.5]" /> Create assistant
              </Link>
            </Button>
          }
        />

        {/* Filters and Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search assistants..."
              className="h-9.5 pl-9 bg-muted/40 border-border/85 rounded-xl text-sm placeholder:text-muted-foreground/60 focus-visible:bg-surface focus-visible:ring-primary/10 transition-all"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9.5 w-full sm:w-[160px] bg-card border-border/85 rounded-xl text-sm font-medium hover:bg-muted/40 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-xl border-border/80">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-9.5 w-full sm:w-[200px] bg-card border-border/85 rounded-xl text-sm font-medium hover:bg-muted/40 transition-colors"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-xl border-border/80">
              <SelectItem value="updated">Sort by last updated</SelectItem>
              <SelectItem value="name">Sort by name</SelectItem>
              <SelectItem value="convos">Sort by conversations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Bot}
            title={assistants.length === 0 ? "No assistants yet" : "No assistants match your filters"}
            description={
              assistants.length === 0
                ? "Create your first assistant in under 2 minutes."
                : "Try clearing the search or status filter."
            }
            action={
              assistants.length === 0 ? (
                <Button asChild className="rounded-xl font-bold"><Link href="/dashboard/assistants/new/create"><Plus className="mr-1.5 h-4 w-4 stroke-[2.5]" /> Create assistant</Link></Button>
              ) : (
                <Button variant="outline" className="rounded-xl border-border/80 font-bold" onClick={() => { setQuery(""); setStatus("all"); }}>Clear filters</Button>
              )
            }
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-border bg-card shadow-ambient">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/30 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                    <th className="px-6 py-3.5">Assistant</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="hidden lg:table-cell px-6 py-3.5">Knowledge</th>
                    <th className="px-6 py-3.5">Conversations</th>
                    <th className="hidden lg:table-cell px-6 py-3.5">Last updated</th>
                    <th className="px-6 py-3.5 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((a) => (
                    <tr
                      key={a.id}
                      className="group cursor-pointer transition-colors hover:bg-muted/15"
                      onClick={() => router.push(`/dashboard/assistants/${a.id}/overview`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary border border-primary/10 transition-transform group-hover:scale-105">
                            <Bot className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{a.name}</div>
                            <div className="truncate text-xs text-muted-foreground/80 mt-0.5 font-medium">{a.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge tone={a.status === "live" ? "success" : a.status === "draft" ? "neutral" : "warning"}>{a.status}</StatusBadge>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 text-sm font-medium text-foreground">{a.knowledgeSources} sources</td>
                      <td className="px-6 py-4 text-sm font-semibold text-foreground">{a.conversations.toLocaleString()}</td>
                      <td className="hidden lg:table-cell px-6 py-4 text-sm font-medium text-muted-foreground/80">{a.lastUpdated}</td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/80 rounded-lg" aria-label="Actions">
                              <MoreHorizontal className="h-4.5 w-4.5 text-muted-foreground/75" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl shadow-lg border border-border/80">
                            <DropdownMenuItem className="font-semibold text-sm" onClick={() => router.push(`/dashboard/assistants/${a.id}/overview`)}>Open</DropdownMenuItem>
                            <DropdownMenuItem className="font-semibold text-sm" onClick={() => toast.success(`Duplicated ${a.name}`)}>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem className="font-semibold text-sm" onClick={() => toast.info(`${a.name} paused`)}>Pause</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive font-semibold text-sm focus:bg-destructive/10"
                              onClick={() => { deleteAssistant(a.id); toast.success(`Deleted ${a.name}`); }}
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

            {/* Mobile Stacked Cards View */}
            <div className="md:hidden space-y-3">
              {filtered.map((a) => (
                <Link
                  key={a.id}
                  href={`/dashboard/assistants/${a.id}/overview`}
                  className="block rounded-2xl border border-border bg-card p-4 transition-all hover:bg-muted/10 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary border border-primary/10">
                      <Bot className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-sm font-semibold text-foreground">{a.name}</div>
                        <StatusBadge tone={a.status === "live" ? "success" : a.status === "draft" ? "neutral" : "warning"}>{a.status}</StatusBadge>
                      </div>
                      <div className="mt-0.75 truncate text-xs text-muted-foreground/80 font-medium">{a.description}</div>
                      <div className="mt-3 flex gap-4 text-xs font-semibold text-muted-foreground/75">
                        <span><b className="font-bold text-foreground">{a.conversations.toLocaleString()}</b> conversations</span>
                        <span><b className="font-bold text-foreground">{a.knowledgeSources}</b> sources</span>
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
