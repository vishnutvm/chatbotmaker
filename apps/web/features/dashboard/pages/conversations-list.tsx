'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TopHeader } from '@/components/shell/TopHeader';
import { PageHeader } from '@/components/common/PageHeader';
import { conversations } from "@/lib/mock/data";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Input } from "@/components/ui/input";
import { Search, MessagesSquare, ArrowUpRight, Globe, ShieldCheck } from "lucide-react";

export default function Inbox() {
  const router = useRouter();
  return (
    <>
      <TopHeader breadcrumb={<span className="text-foreground font-semibold">Conversations</span>} />
      <div className="mx-auto max-w-[1400px] px-6 py-8 space-y-6 animate-in fade-in duration-300">
        <PageHeader title="Conversations" description="Every conversation across all of your assistants." />

        <div className="grid gap-0 rounded-2xl border border-border bg-card overflow-hidden lg:grid-cols-[340px_minmax(0,1fr)_300px] min-h-[650px] shadow-ambient">
          {/* Left panel - Conversation List */}
          <div className="border-r border-border/80 flex flex-col bg-muted/5">
            <div className="border-b border-border/80 p-3.5 bg-card">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                <Input placeholder="Search conversations..." className="h-9.5 pl-9 text-xs bg-muted/40 border-border/85 rounded-xl placeholder:text-muted-foreground/60 focus-visible:bg-surface focus-visible:ring-primary/10 transition-all" />
              </div>
            </div>
            <div className="divide-y divide-border/60 max-h-[600px] overflow-y-auto scrollbar-thin flex-1">
              {conversations.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => router.push(`/dashboard/conversations/${c.id}`)}
                  className={`flex w-full items-start gap-3.5 px-5 py-4 text-left transition-all border-l-3 hover:bg-muted/15 ${i === 1 ? "bg-primary/5 border-primary shadow-2xs" : "border-transparent"}`}
                >
                  <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground border border-border/60">{c.visitorInitials}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="truncate text-sm font-semibold text-foreground">{c.visitor}</span>
                      <span className="shrink-0 text-[10px] font-bold text-muted-foreground/60">{c.time}</span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground/80 font-medium mb-2.5">{c.lastMessage}</div>
                    <div><StatusBadge tone={c.status === "resolved" ? "success" : c.status === "open" ? "info" : "warning"}>{c.status}</StatusBadge></div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Center panel - Conversation Preview */}
          <div className="hidden lg:flex flex-col bg-card">
            <div className="border-b border-border/80 px-6 py-4.5 bg-muted/5 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-foreground">Marcus Lee · Acme Support</div>
                <div className="text-xs text-muted-foreground/80 font-medium mt-0.5">Started 12 minutes ago · Web widget</div>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Active Session</span>
              </div>
            </div>
            <div className="flex-1 space-y-4.5 overflow-y-auto p-6 bg-muted/5 scrollbar-thin">
              <Bubble role="user">Hi! How do I upgrade my plan?</Bubble>
              <Bubble role="assistant">You can upgrade any time from Settings → Billing. The change takes effect immediately and you'll only be billed the prorated amount.</Bubble>
              <Bubble role="user">Do I get the annual discount if I switch mid-cycle?</Bubble>
              <Bubble role="assistant">Yes — switching to annual mid-cycle applies the 20% discount and credits your unused monthly balance to the new plan.</Bubble>
            </div>
            <div className="border-t border-border/80 px-6 py-4 text-center text-xs text-muted-foreground/75 font-semibold bg-muted/5">
              <span className="inline-flex items-center gap-1.5 bg-card border border-border px-3.5 py-1.5 rounded-xl shadow-2xs">
                <ShieldCheck className="h-4 w-4 text-success" /> Read-only preview · 
                <Link href={`/dashboard/conversations/${conversations[0]?.id ?? ''}`} className="text-primary hover:text-primary-hover font-bold inline-flex items-center gap-0.5">
                  Open full ticket <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </span>
            </div>
          </div>

          {/* Right panel - Session Metadata Details */}
          <div className="hidden lg:block border-l border-border/80 p-6 space-y-5 bg-card">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <MessagesSquare className="h-4.5 w-4.5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">Session Details</span>
            </div>
            <Detail label="Assistant" value="Acme Support" />
            <Detail label="Status" value={<StatusBadge tone="info">open</StatusBadge>} />
            <Detail label="Channel" value="Web widget" />
            <Detail label="Messages" value="4" />
            
            <div className="border-t border-border/60 pt-4 space-y-4">
              <Detail label="Visitor" value="Marcus Lee" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">Session ID</div>
                <div className="font-mono text-xs text-foreground bg-muted/40 px-2 py-1 rounded-md border border-border/40 truncate">#a7f2-c901-b258</div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 font-medium">
                <Globe className="h-3.5 w-3.5 text-muted-foreground/60" /> San Francisco, United States
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={`flex gap-3 items-start max-w-[80%] ${role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
      <div className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold shadow-3xs ${role === "user" ? "bg-primary text-primary-foreground border-primary/20" : "bg-card text-muted-foreground border-border"}`}>
        {role === "user" ? "U" : "AI"}
      </div>
      <div className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed font-medium shadow-2xs border ${role === "user" ? "bg-primary text-primary-foreground border-primary/10 rounded-tr-sm" : "bg-card text-foreground border-border/85 rounded-tl-sm"}`}>
        {children}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">{label}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
