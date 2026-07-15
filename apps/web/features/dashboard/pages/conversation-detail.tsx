'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { TopHeader } from '@/components/shell/TopHeader';
import { messagesById, conversations } from "@/lib/mock/data";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ChevronLeft, FileText, Bot, User, Globe, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConvoDetail() {
  const params = useParams();
  const id = String(params.conversationId ?? '');
  const c = conversations.find((x) => x.id === id) ?? conversations[0];
  const msgs = messagesById[id] ?? messagesById.c2;

  return (
    <>
      <TopHeader
        breadcrumb={
          <div className="flex items-center gap-1.5 font-medium text-sm">
            <Link href="/dashboard/conversations" className="hover:text-foreground transition-colors">Conversations</Link>
            <span className="text-muted-foreground/60">/</span>
            <span className="text-foreground font-semibold">{c.visitor}</span>
          </div>
        }
      />
      <div className="mx-auto max-w-[1240px] px-6 py-6 animate-in fade-in duration-300">
        <Button asChild variant="ghost" size="sm" className="mb-4 rounded-xl text-xs font-bold hover:bg-muted/80">
          <Link href="/dashboard/conversations">
            <ChevronLeft className="mr-1 h-4 w-4 stroke-[2.5]" /> Back to Inbox
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Left panel - Chat Logs */}
          <div className="rounded-2xl border border-border bg-card shadow-ambient overflow-hidden flex flex-col">
            <div className="border-b border-border/80 px-6 py-4.5 bg-muted/5 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-foreground">{c.visitor}</div>
                <div className="text-xs text-muted-foreground/80 font-medium mt-0.5">{c.assistantName} · Web widget</div>
              </div>
              <StatusBadge tone={c.status === "resolved" ? "success" : c.status === "open" ? "info" : "warning"}>{c.status}</StatusBadge>
            </div>
            
            <div className="space-y-5 p-6 bg-muted/5">
              {msgs.map((m) => (
                <div key={m.id} className={`flex gap-3.5 items-start max-w-[85%] animate-in fade-in duration-300 ${m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                  {/* Avatar box */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border shadow-2xs ${m.role === "user" ? "bg-primary text-primary-foreground border-primary/20" : "bg-card text-muted-foreground border-border"}`}>
                    {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  {/* Message body */}
                  <div className="space-y-2 flex-1">
                    <div className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed font-medium shadow-2xs border ${m.role === "user" ? "bg-primary text-primary-foreground border-primary/10 rounded-tr-sm" : "bg-card text-foreground border-border/85 rounded-tl-sm"}`}>
                      {m.content}
                    </div>
                    {m.sources && (
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {m.sources.map((s) => (
                          <span key={s.url} className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground shadow-3xs">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground/80" /> {s.title}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className={`text-[10px] font-bold text-muted-foreground/50 mt-1.5 ${m.role === "user" ? "text-right" : ""}`}>{m.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel - Session Details Metadata */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-ambient self-start">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <MessagesSquare className="h-4.5 w-4.5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">Session Log</span>
            </div>
            
            <Detail label="Assistant" value={c.assistantName} />
            <Detail label="Channel" value="Web widget" />
            <Detail label="Messages" value={String(c.messageCount)} />
            <Detail label="Started" value="Today, 10:24 AM" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">Session Token</div>
              <div className="font-mono text-xs text-foreground bg-muted/40 px-2 py-1 rounded-md border border-border/40 truncate select-all">#a7f2-c901-b258</div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 font-medium pt-2 border-t border-border/60">
              <Globe className="h-3.5 w-3.5 text-muted-foreground/60" /> San Francisco, US
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">{label}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
