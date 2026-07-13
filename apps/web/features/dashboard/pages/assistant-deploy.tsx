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
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Deploy</h2>
        <p className="text-sm text-muted-foreground">Choose how visitors will talk to your assistant.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Method icon={Globe} title="Add to website" desc="Paste a snippet" active />
        <Method icon={LinkIcon} title="Share a link" desc="Public URL" />
        <Method icon={Code2} title="Use the API" desc="Embed with SDK" />
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Website snippet</h3>
        <div className="mt-4 rounded-lg border border-border bg-surface-muted">
          <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">HTML</span>
            <Button size="sm" variant="ghost" className="h-7" onClick={copy}><Copy className="mr-1 h-3.5 w-3.5" /> Copy</Button>
          </div>
          <pre className="overflow-x-auto p-4 text-[12px] font-mono leading-relaxed text-foreground">{snippet}</pre>
        </div>
      </div>
    </div>
  );
}

function Method({ icon: Icon, title, desc, active }: any) {
  return (
    <div className={`rounded-lg border p-4 ${active ? "border-primary bg-primary-subtle/40 ring-1 ring-primary" : "border-border bg-surface"}`}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-md ${active ? "bg-primary text-primary-foreground" : "bg-surface-muted text-foreground"}`}><Icon className="h-4 w-4" /></div>
      <div className="mt-3 text-sm font-semibold text-foreground">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}
