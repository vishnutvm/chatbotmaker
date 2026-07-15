'use client';

import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Globe, Link as LinkIcon, Code2, Copy } from "lucide-react";
import { toast } from "sonner";

export default function Deploy() {
  const params = useParams(); const id = String(params.assistantId ?? params.id ?? "");
  const snippet = `<script async src="https://cdn.cohere.dev/widget.js" data-assistant="${id}"></script>`;
  const copy = async () => { await navigator.clipboard.writeText(snippet); toast.success("Copied to clipboard"); };
  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-lg font-bold text-foreground tracking-tight">Deploy</h2>
        <p className="text-xs text-muted-foreground/80 mt-0.5 font-medium">Choose how visitors will talk to your assistant.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Method icon={Globe} title="Add to website" desc="Paste a snippet" active />
        <Method icon={LinkIcon} title="Share a link" desc="Public URL" />
        <Method icon={Code2} title="Use the API" desc="Embed with SDK" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-ambient">
        <h3 className="text-base font-bold text-foreground tracking-tight">Website snippet</h3>
        <div className="mt-4 rounded-xl border border-border/80 bg-muted/20 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-2">
            <span className="text-[11px] font-bold text-muted-foreground/80 tracking-wider">HTML</span>
            <Button size="sm" variant="ghost" className="h-7.5 rounded-lg text-xs font-semibold hover:bg-muted/80" onClick={copy}><Copy className="mr-1.5 h-3.5 w-3.5" /> Copy snippet</Button>
          </div>
          <pre className="overflow-x-auto p-4 text-[12px] font-mono leading-relaxed text-foreground select-all">{snippet}</pre>
        </div>
      </div>
    </div>
  );
}

function Method({ icon: Icon, title, desc, active }: any) {
  return (
    <div className={`rounded-2xl border p-4.5 transition-all duration-300 shadow-2xs ${active ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card hover:border-border-strong hover:bg-muted/10"}`}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${active ? "bg-primary text-primary-foreground border-primary/20 shadow-sm" : "bg-muted text-muted-foreground border-border/60"}`}><Icon className="h-4.5 w-4.5" /></div>
      <div className="mt-3.5 text-sm font-bold text-foreground leading-tight">{title}</div>
      <div className="text-xs text-muted-foreground/80 mt-0.75 font-medium">{desc}</div>
    </div>
  );
}
