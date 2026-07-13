'use client';


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWizard } from "@/lib/wizard-context";
import { WizardFooter } from "@/features/dashboard/wizard-footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Globe, Link as LinkIcon, Code2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { addAssistant, addKnowledge } from "@/lib/store";
import { purposes } from "@/lib/mock/data";



type Method = "website" | "share" | "api";

export default function Step() {
  const { draft, reset } = useWizard();
  const [method, setMethod] = useState<Method>("website");
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const snippet = `<script async src="https://cdn.cohere.dev/widget.js"
  data-assistant="${(draft.name || "your-assistant").toLowerCase().replace(/\s+/g, "-")}"></script>`;

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mx-auto max-w-[880px] px-8 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-subtle text-success">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Your assistant is ready</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Choose how you'd like to deploy <span className="font-medium text-foreground">{draft.name || "your assistant"}</span>.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Method active={method === "website"} onClick={() => setMethod("website")} icon={Globe} title="Add to website" desc="Paste a snippet — 30 seconds." recommended />
        <Method active={method === "share"} onClick={() => setMethod("share")} icon={LinkIcon} title="Share a link" desc="Send a public URL to anyone." />
        <Method active={method === "api"} onClick={() => setMethod("api")} icon={Code2} title="Use the API" desc="Embed anywhere with our SDK." />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-6">
        {method === "website" && (
          <div>
            <h3 className="text-base font-semibold text-foreground">Add the widget to your site</h3>
            <p className="mt-1 text-sm text-muted-foreground">Paste this snippet before the closing <code className="rounded bg-surface-muted px-1 py-0.5 text-[11px]">{"</body>"}</code> tag.</p>
            <div className="mt-4 rounded-lg border border-border bg-surface-muted">
              <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">HTML</span>
                <Button size="sm" variant="ghost" className="h-7" onClick={() => copy(snippet)}>
                  {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <pre className="overflow-x-auto p-4 text-[12px] font-mono leading-relaxed text-foreground">{snippet}</pre>
            </div>
            <div className="mt-4 rounded-lg bg-surface-muted/60 p-4 text-sm">
              <div className="font-medium text-foreground">Not sure how?</div>
              <p className="mt-1 text-xs text-muted-foreground">We have step-by-step guides for WordPress, Webflow, Shopify, Next.js and more.</p>
            </div>
          </div>
        )}

        {method === "share" && (
          <div>
            <h3 className="text-base font-semibold text-foreground">Share a link</h3>
            <p className="mt-1 text-sm text-muted-foreground">Anyone with the link can chat with your assistant.</p>
            <div className="mt-4 flex gap-2">
              <input readOnly value={`https://chat.cohere.dev/${(draft.name || "acme").toLowerCase().replace(/\s+/g, "-")}`} className="h-10 flex-1 rounded-md border border-border bg-surface-muted px-3 text-sm font-mono text-foreground" />
              <Button onClick={() => copy(`https://chat.cohere.dev/${(draft.name || "acme").toLowerCase().replace(/\s+/g, "-")}`)}>
                {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />} Copy link
              </Button>
            </div>
          </div>
        )}

        {method === "api" && (
          <div>
            <h3 className="text-base font-semibold text-foreground">Use the API</h3>
            <p className="mt-1 text-sm text-muted-foreground">Call your assistant from any backend, or embed with the JS SDK.</p>
            <div className="mt-4 rounded-lg border border-border bg-surface-muted">
              <div className="border-b border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground">cURL</div>
              <pre className="overflow-x-auto p-4 text-[12px] font-mono leading-relaxed text-foreground">
{`curl https://api.cohere.dev/v1/dashboard/assistants/${(draft.name || "acme").toLowerCase()}/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"message":"How do I upgrade?"}'`}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 mt-10 flex items-center justify-between border-t border-border bg-surface px-8 py-4">
        <Button variant="ghost" onClick={() => history.back()}>← Back</Button>
        <Button
          size="lg"
          className="h-10"
          onClick={() => {
            const purpose = purposes.find((p) => p.id === draft.purpose);
            const created = addAssistant({
              name: draft.name || "Untitled assistant",
              description: purpose?.description ?? "",
              purpose: purpose?.title ?? "Custom Assistant",
              status: "live",
            });
            if (draft.knowledgeUrl.trim() && draft.importedPages > 0) {
              try {
                const host = new URL(draft.knowledgeUrl).host || draft.knowledgeUrl;
                addKnowledge({
                  assistantId: created.id,
                  name: host,
                  type: "website",
                  pages: draft.importedPages,
                });
              } catch {
                addKnowledge({
                  assistantId: created.id,
                  name: draft.knowledgeUrl,
                  type: "website",
                  pages: draft.importedPages,
                });
              }
            }
            toast.success(`${created.name} deployed`);
            reset();
            router.push(`/dashboard/assistants/${created.id}/overview`);
          }}
        >
          Finish setup
        </Button>
      </div>
    </div>
  );
}

function Method({ active, onClick, icon: Icon, title, desc, recommended }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-start rounded-lg border p-4 text-left transition-all",
        active ? "border-primary bg-primary-subtle/40 ring-1 ring-primary" : "border-border bg-surface hover:border-border-strong",
      )}
    >
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-md", active ? "bg-primary text-primary-foreground" : "bg-surface-muted text-foreground")}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        {recommended && <span className="rounded-full bg-primary-subtle px-1.5 py-0.5 text-[10px] font-medium text-primary">Recommended</span>}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
    </button>
  );
}
