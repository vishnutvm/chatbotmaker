'use client';

import { useParams } from 'next/navigation';
import { useKnowledgeSources, removeKnowledge } from "@/lib/store";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Globe, FileText, Map, Type, MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { BookOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const iconMap = { website: Globe, file: FileText, sitemap: Map, text: Type };

export default function Knowledge() {
  const params = useParams(); const id = String(params.assistantId ?? params.id ?? "");
  const sources = useKnowledgeSources(id);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Knowledge</h2>
          <p className="text-xs text-muted-foreground/80 mt-0.5 font-medium">Give your assistant information it can use to answer questions.</p>
        </div>
        <Button className="rounded-xl font-bold shadow-xs"><Plus className="mr-1.5 h-4 w-4 stroke-[2.5]" /> Add knowledge</Button>
      </div>

      {sources.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No knowledge added yet"
          description="Scan your website, upload files or paste text. Your assistant uses this to answer questions."
          action={<Button className="rounded-xl font-bold"><Plus className="mr-1.5 h-4 w-4 stroke-[2.5]" /> Add knowledge</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-ambient">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                <th className="px-6 py-3.5">Source</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="hidden md:table-cell px-6 py-3.5">Pages</th>
                <th className="hidden md:table-cell px-6 py-3.5">Last updated</th>
                <th className="px-6 py-3.5 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sources.map((s) => {
                const Icon = iconMap[s.type];
                return (
                  <tr key={s.id} className="hover:bg-muted/15 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground border border-border/60"><Icon className="h-4 w-4" /></div>
                        <span className="text-sm font-semibold text-foreground">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/75">{s.type}</td>
                    <td className="px-6 py-4">
                      <StatusBadge tone={s.status === "ready" ? "success" : s.status === "processing" ? "info" : s.status === "failed" ? "error" : "warning"}>
                        {s.status.replace("_", " ")}
                      </StatusBadge>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 text-sm font-semibold text-foreground">{s.pages}</td>
                    <td className="hidden md:table-cell px-6 py-4 text-sm font-medium text-muted-foreground/80">{s.updated}</td>
                    <td className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/80 rounded-lg" aria-label="Actions"><MoreHorizontal className="h-4.5 w-4.5 text-muted-foreground/75" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-border/80 shadow-lg">
                          <DropdownMenuItem className="font-semibold text-sm"><RefreshCw className="mr-2 h-3.5 w-3.5" /> Re-sync</DropdownMenuItem>
                          <DropdownMenuItem className="font-semibold text-sm">View pages</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive font-semibold text-sm focus:bg-destructive/10" onClick={() => removeKnowledge(s.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-muted/25 p-5 shadow-2xs">
        <div className="text-xs font-bold uppercase tracking-wider text-foreground">Advanced settings</div>
        <p className="mt-1 text-xs text-muted-foreground/80 font-medium">Fine-tune re-indexing, retrieval and chunking behavior for power users.</p>
      </div>
    </div>
  );
}
