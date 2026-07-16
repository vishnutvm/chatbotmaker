'use client';


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createAssistantsClient } from "@genie/api-client";
import type { KnowledgeSourceDto } from "@genie/types";
import { getAccessToken, getApiBaseUrl } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import { useWizard } from "@/lib/wizard-context";
import { WizardFooter } from "@/features/dashboard/wizard-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProcessingSteps } from "@/components/common/ProcessingSteps";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Globe, FileText, Map, Type, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";



type Source = "website" | "sitemap" | "file" | "text";
type Phase = "input" | "saving" | "done";

const sources: { id: Source; title: string; description: string; icon: any; recommended?: boolean; comingSoon?: boolean }[] = [
  { id: "website", title: "Website", description: "Add a page URL — fastest way to teach your assistant.", icon: Globe, recommended: true },
  { id: "text", title: "Add text", description: "Paste plain text like policies or FAQs.", icon: Type },
  { id: "file", title: "Upload files", description: "PDF, DOCX, MD, TXT up to 20 MB each.", icon: FileText, comingSoon: true },
  { id: "sitemap", title: "Sitemap", description: "Import from an XML sitemap URL.", icon: Map, comingSoon: true },
];

function knowledgeStatusTone(status: KnowledgeSourceDto['status']) {
  if (status === 'ready') return 'success' as const;
  if (status === 'pending') return 'info' as const;
  return 'error' as const;
}

export default function Step() {
  const { draft, update, hydrated } = useWizard();
  const { activeOrg } = useAuth();
  const router = useRouter();

  const [source, setSource] = useState<Source>("website");
  const [phase, setPhase] = useState<Phase>("input");
  const [progress, setProgress] = useState(0);
  const [textContent, setTextContent] = useState("");
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSourceDto[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);

  useEffect(() => {
    if (hydrated && !draft.assistantId) {
      toast.error('Create your assistant first.');
      router.replace('/dashboard/assistants/new/create');
    }
  }, [hydrated, draft.assistantId, router]);

  useEffect(() => {
    if (!draft.assistantId || !activeOrg) return;
    let cancelled = false;
    (async () => {
      setLoadingSources(true);
      try {
        const token = await getAccessToken();
        if (!token) return;
        const client = createAssistantsClient(getApiBaseUrl());
        const res = await client.listKnowledge(token, activeOrg.id, draft.assistantId!);
        if (!cancelled) setKnowledgeSources(res.sources);
      } catch {
        /* non-fatal — list is best-effort */
      } finally {
        if (!cancelled) setLoadingSources(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.assistantId, activeOrg?.id]);

  const stepsView = [
    { label: "Sending to your assistant", status: progress >= 1 ? "done" : "active" },
    { label: "Processing content", status: progress >= 2 ? "done" : progress === 1 ? "active" : "pending" },
    { label: "Ready to use", status: progress >= 3 ? "done" : progress === 2 ? "active" : "pending" },
  ] as const;

  async function addWebsite() {
    if (!draft.assistantId || !activeOrg) return;
    const url = draft.knowledgeUrl.trim();
    if (!url) return;
    let host = url;
    try {
      host = new URL(url).host || url;
    } catch {
      toast.error('Enter a valid URL, e.g. https://acme.com/pricing');
      return;
    }
    setPhase("saving");
    setProgress(1);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const client = createAssistantsClient(getApiBaseUrl());
      setProgress(2);
      const created = await client.addKnowledge(token, activeOrg.id, draft.assistantId, {
        type: 'url',
        name: host,
        url,
      });
      setProgress(3);
      setKnowledgeSources((prev) => [created, ...prev]);
      setPhase("done");
      update({ knowledgeUrl: '', importedPages: draft.importedPages + 1 });
      if (created.status === 'failed') {
        toast.error(`Could not read ${host}. You can try another URL.`);
      } else {
        toast.success(`Added ${host} to your assistant's knowledge`);
      }
    } catch (err) {
      setPhase("input");
      setProgress(0);
      toast.error(err instanceof Error ? err.message : 'Could not add this website');
    }
  }

  async function addText() {
    if (!draft.assistantId || !activeOrg) return;
    const content = textContent.trim();
    if (!content) return;
    setPhase("saving");
    setProgress(1);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const client = createAssistantsClient(getApiBaseUrl());
      setProgress(2);
      const created = await client.addKnowledge(token, activeOrg.id, draft.assistantId, {
        type: 'text',
        name: 'Pasted text',
        content,
      });
      setProgress(3);
      setKnowledgeSources((prev) => [created, ...prev]);
      setPhase("done");
      setTextContent('');
      toast.success('Added text to your assistant\'s knowledge');
    } catch (err) {
      setPhase("input");
      setProgress(0);
      toast.error(err instanceof Error ? err.message : 'Could not add this text');
    }
  }

  return (
    <div className="mx-auto max-w-[820px] px-8 py-10">
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Teach your assistant</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Add information your assistant can use to answer questions.</p>
      </div>

      {/* Source selector */}
      <div className="grid gap-3 sm:grid-cols-2">
        {sources.map((s) => {
          const Icon = s.icon;
          const selected = source === s.id;
          return (
            <button
              key={s.id}
              type="button"
              disabled={s.comingSoon}
              onClick={() => { setSource(s.id); setPhase("input"); setProgress(0); }}
              className={cn(
                "relative flex items-start gap-3 rounded-lg border p-4 text-left transition-all",
                s.comingSoon && "opacity-60 cursor-not-allowed",
                selected ? "border-primary bg-primary-subtle/40 ring-1 ring-primary" : "border-border bg-surface hover:border-border-strong",
              )}
            >
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", selected ? "bg-primary text-primary-foreground" : "bg-surface-muted text-foreground")}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{s.title}</span>
                  {s.recommended && <span className="rounded-full bg-primary-subtle px-1.5 py-0.5 text-[10px] font-medium text-primary">Recommended</span>}
                  {s.comingSoon && <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Coming soon</span>}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{s.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Source content */}
      <div className="mt-6 rounded-xl border border-border bg-surface p-6">
        {source === "website" && phase === "input" && (
          <div>
            <Label htmlFor="url" className="text-sm font-medium">A page URL to learn from</Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="url"
                value={draft.knowledgeUrl}
                onChange={(e) => update({ knowledgeUrl: e.target.value })}
                placeholder="https://acme.com/pricing"
                className="h-11"
              />
              <Button onClick={addWebsite} disabled={!draft.knowledgeUrl.trim()} className="h-11 px-5">
                <Sparkles className="mr-1.5 h-4 w-4" /> Add
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              We&apos;ll fetch this page and add its content to your assistant&apos;s knowledge.
            </p>
          </div>
        )}
        {source === "website" && phase === "saving" && (
          <div className="py-4">
            <div className="mb-4 text-sm text-foreground">Adding <span className="font-medium">{draft.knowledgeUrl || 'your page'}</span></div>
            <ProcessingSteps steps={stepsView as any} />
          </div>
        )}
        {source === "website" && phase === "done" && (
          <div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="font-medium text-foreground">Added to your assistant&apos;s knowledge.</span>
            </div>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setPhase('input')}>
              Add another page
            </Button>
          </div>
        )}

        {source === "text" && phase === "input" && (
          <div>
            <Label className="text-sm font-medium">Add text</Label>
            <Textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste FAQs, policies, or any text your assistant should know…"
              className="mt-2 min-h-[200px]"
            />
            <Button onClick={addText} disabled={!textContent.trim()} className="mt-3 h-10 px-5">
              <Sparkles className="mr-1.5 h-4 w-4" /> Add text
            </Button>
          </div>
        )}
        {source === "text" && phase === "saving" && (
          <div className="py-4">
            <div className="mb-4 text-sm text-foreground">Saving your text…</div>
            <ProcessingSteps steps={stepsView as any} />
          </div>
        )}
        {source === "text" && phase === "done" && (
          <div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="font-medium text-foreground">Added to your assistant&apos;s knowledge.</span>
            </div>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setPhase('input')}>
              Add more text
            </Button>
          </div>
        )}

        {source === "file" && (
          <div>
            <Label className="text-sm font-medium">Upload files</Label>
            <div className="mt-2 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface-muted/40 px-6 py-10 text-center">
              <FileText className="h-6 w-6 text-muted-foreground" />
              <div className="mt-3 text-sm font-medium text-foreground">File uploads are coming soon</div>
              <div className="mt-1 text-xs text-muted-foreground">For now, paste content directly using &quot;Add text&quot;.</div>
              <Button variant="outline" className="mt-4" size="sm" disabled>Choose files</Button>
            </div>
          </div>
        )}
        {source === "sitemap" && (
          <div>
            <Label className="text-sm font-medium">Sitemap URL</Label>
            <Input placeholder="https://acme.com/sitemap.xml" className="mt-2 h-11" disabled />
            <p className="mt-2 text-xs text-muted-foreground">Sitemap import is coming soon. Add individual page URLs from the Website tab for now.</p>
          </div>
        )}
      </div>

      {/* Added sources */}
      {(loadingSources || knowledgeSources.length > 0) && (
        <div className="mt-6">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Knowledge sources
          </div>
          <div className="rounded-lg border border-border divide-y divide-border">
            {loadingSources && knowledgeSources.length === 0 && (
              <div className="px-4 py-3 text-sm text-muted-foreground">Loading…</div>
            )}
            {knowledgeSources.map((k) => (
              <div key={k.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{k.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{k.type}</div>
                </div>
                <StatusBadge tone={knowledgeStatusTone(k.status)}>{k.status}</StatusBadge>
              </div>
            ))}
          </div>
        </div>
      )}

      <WizardFooter
        backTo="/dashboard/assistants/new/create"
        nextTo="/dashboard/assistants/new/customize"
        nextLabel="Continue to customize"
      />
    </div>
  );
}
