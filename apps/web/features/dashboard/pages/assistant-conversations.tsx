'use client';

import { useParams } from 'next/navigation';

import { conversations } from "@/lib/mock/data";
import { StatusBadge } from "@/components/common/StatusBadge";



export default function AssistantConversations() {
  const params = useParams(); const id = String(params.assistantId ?? params.id ?? "");
  const list = conversations.filter((c) => c.assistantId === id);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Conversations</h2>
      </div>
      <div className="divide-y divide-border">
        {list.map((c) => (
          <div key={c.id} className="flex items-center gap-3 px-5 py-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-[11px] font-semibold text-foreground">{c.visitorInitials}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">{c.visitor}</span>
                <StatusBadge tone={c.status === "resolved" ? "success" : c.status === "open" ? "info" : "warning"}>{c.status}</StatusBadge>
              </div>
              <div className="truncate text-xs text-muted-foreground">{c.lastMessage}</div>
            </div>
            <div className="text-xs text-muted-foreground shrink-0">{c.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
