'use client';

import { useParams } from 'next/navigation';

import { useKnowledgeSources, removeKnowledge } from "@/lib/store";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Globe, FileText, Map, Type, MoreHorizontal, RefreshCw } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Knowledge</h2>
          <p className="text-sm text-muted-foreground">Give your assistant information it can use to answer questions.</p>
        </div>
        <Button><Plus className="mr-1.5 h-4 w-4" /> Add knowledge</Button>
      </div>

      {sources.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No knowledge added yet"
          description="Scan your website, upload files or paste text. Your assistant uses this to answer questions."
          action={<Button><Plus className="mr-1.5 h-4 w-4" /> Add knowledge</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-muted/60 text-left text-xs font-medium text-muted-foreground">
                <th className="px-5 py-2.5">Source</th>
                <th className="px-5 py-2.5">Type</th>
                <th className="px-5 py-2.5">Status</th>
                <th className="hidden md:table-cell px-5 py-2.5">Pages</th>
                <th className="hidden md:table-cell px-5 py-2.5">Last updated</th>
                <th className="px-5 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sources.map((s) => {
                const Icon = iconMap[s.type];
                return (
                  <tr key={s.id} className="hover:bg-surface-muted/40">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-muted text-foreground"><Icon className="h-3.5 w-3.5" /></div>
                        <span className="text-sm font-medium text-foreground">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm capitalize text-muted-foreground">{s.type}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge tone={s.status === "ready" ? "success" : s.status === "processing" ? "info" : s.status === "failed" ? "error" : "warning"}>
                        {s.status.replace("_", " ")}
                      </StatusBadge>
                    </td>
                    <td className="hidden md:table-cell px-5 py-3.5 text-sm text-foreground">{s.pages}</td>
                    <td className="hidden md:table-cell px-5 py-3.5 text-sm text-muted-foreground">{s.updated}</td>
                    <td className="px-5 py-3.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><RefreshCw className="mr-2 h-3.5 w-3.5" /> Re-sync</DropdownMenuItem>
                          <DropdownMenuItem>View pages</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => removeKnowledge(s.id)}>Remove</DropdownMenuItem>
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

      <div className="rounded-lg border border-border bg-surface-muted/50 p-4">
        <div className="text-xs font-medium text-foreground">Advanced settings</div>
        <p className="mt-1 text-xs text-muted-foreground">Fine-tune re-indexing, retrieval and chunking behavior for power users.</p>
      </div>
    </div>
  );
}
