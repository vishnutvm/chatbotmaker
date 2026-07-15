'use client';

import { useParams } from 'next/navigation';
import { conversations } from "@/lib/mock/data";
import { StatusBadge } from "@/components/common/StatusBadge";

export default function AssistantConversations() {
  const params = useParams(); const id = String(params.assistantId ?? params.id ?? "");
  const list = conversations.filter((c) => c.assistantId === id);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-ambient animate-in fade-in duration-300">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-base font-bold text-foreground tracking-tight">Conversations</h2>
      </div>
      <div className="divide-y divide-border/60">
        {list.length === 0 ? (
          <div className="p-8 text-center text-sm font-semibold text-muted-foreground/80">No conversations.</div>
        ) : list.map((c) => (
          <div key={c.id} className="flex items-center gap-3.5 px-6 py-4 hover:bg-muted/15 transition-colors">
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground border border-border/65">{c.visitorInitials}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="truncate text-sm font-semibold text-foreground">{c.visitor}</span>
                <StatusBadge tone={c.status === "resolved" ? "success" : c.status === "open" ? "info" : "warning"}>{c.status}</StatusBadge>
              </div>
              <div className="truncate text-xs text-muted-foreground/80 font-medium">{c.lastMessage}</div>
            </div>
            <div className="text-xs text-muted-foreground/60 font-semibold shrink-0">{c.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
