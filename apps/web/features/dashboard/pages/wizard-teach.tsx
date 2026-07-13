'use client';


import { useState } from "react";
import { useWizard } from "@/lib/wizard-context";
import { WizardFooter } from "@/features/dashboard/wizard-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProcessingSteps } from "@/components/common/ProcessingSteps";
import { Checkbox } from "@/components/ui/checkbox";
import { Globe, FileText, Map, Type, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";



type Source = "website" | "sitemap" | "file" | "text";
type Phase = "input" | "scanning" | "results";

const sources: { id: Source; title: string; description: string; icon: any; recommended?: boolean }[] = [
  { id: "website", title: "Website", description: "Scan your site — fastest way to teach your assistant.", icon: Globe, recommended: true },
  { id: "file", title: "Upload files", description: "PDF, DOCX, MD, TXT up to 20 MB each.", icon: FileText },
  { id: "sitemap", title: "Sitemap", description: "Import from an XML sitemap URL.", icon: Map },
  { id: "text", title: "Add text", description: "Paste plain text like policies or FAQs.", icon: Type },
];

export default function Step() {
  const { draft, update } = useWizard();
  const [source, setSource] = useState<Source>("website");
  const [phase, setPhase] = useState<Phase>("input");
  const [progress, setProgress] = useState(0);

  const scan = () => {
    setPhase("scanning");
    setProgress(0);
    const steps = 4;
    let s = 0;
    const timer = setInterval(() => {
      s += 1;
      setProgress(s);
      if (s >= steps) {
        clearInterval(timer);
        setTimeout(() => {
          setPhase("results");
          update({ importedPages: 47 });
        }, 400);
      }
    }, 700);
  };

  const stepsView = [
    { label: "Discovering pages", status: progress >= 1 ? "done" : progress === 0 ? "active" : "pending" },
    { label: "Reading content", status: progress >= 2 ? "done" : progress === 1 ? "active" : "pending" },
    { label: "Preparing knowledge", status: progress >= 3 ? "done" : progress === 2 ? "active" : "pending" },
    { label: "Ready", status: progress >= 4 ? "done" : progress === 3 ? "active" : "pending" },
  ] as const;

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
              onClick={() => { setSource(s.id); setPhase("input"); }}
              className={cn(
                "relative flex items-start gap-3 rounded-lg border p-4 text-left transition-all",
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
            <Label htmlFor="url" className="text-sm font-medium">Your website URL</Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="url"
                value={draft.knowledgeUrl}
                onChange={(e) => update({ knowledgeUrl: e.target.value })}
                placeholder="https://acme.com"
                className="h-11"
              />
              <Button onClick={scan} disabled={!draft.knowledgeUrl.trim()} className="h-11 px-5">
                <Sparkles className="mr-1.5 h-4 w-4" /> Scan website
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              We'll crawl your public pages. You can pick which ones to import.
            </p>
          </div>
        )}
        {source === "website" && phase === "scanning" && (
          <div className="py-4">
            <div className="mb-4 text-sm text-foreground">Scanning <span className="font-medium">{draft.knowledgeUrl}</span></div>
            <ProcessingSteps steps={stepsView as any} />
          </div>
        )}
        {source === "website" && phase === "results" && <ResultsList url={draft.knowledgeUrl} />}

        {source === "file" && (
          <div>
            <Label className="text-sm font-medium">Upload files</Label>
            <div className="mt-2 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface-muted/40 px-6 py-10 text-center">
              <FileText className="h-6 w-6 text-muted-foreground" />
              <div className="mt-3 text-sm font-medium text-foreground">Drop files here or click to browse</div>
              <div className="mt-1 text-xs text-muted-foreground">PDF, DOCX, MD, TXT — up to 20 MB each</div>
              <Button variant="outline" className="mt-4" size="sm">Choose files</Button>
            </div>
          </div>
        )}
        {source === "sitemap" && (
          <div>
            <Label className="text-sm font-medium">Sitemap URL</Label>
            <Input placeholder="https://acme.com/sitemap.xml" className="mt-2 h-11" />
          </div>
        )}
        {source === "text" && (
          <div>
            <Label className="text-sm font-medium">Add text</Label>
            <Textarea placeholder="Paste FAQs, policies, or any text your assistant should know…" className="mt-2 min-h-[200px]" />
          </div>
        )}
      </div>

      <WizardFooter
        backTo="/dashboard/assistants/new/create"
        nextTo="/dashboard/assistants/new/customize"
        nextLabel="Continue to customize"
      />
    </div>
  );
}

function ResultsList({ url }: { url: string }) {
  const pages = [
    "/", "/pricing", "/features", "/about", "/customers", "/blog", "/docs", "/security",
    "/contact", "/careers", "/changelog", "/help", "/terms", "/privacy",
  ];
  return (
    <div>
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <span className="font-medium text-foreground">We found 47 pages on {url}.</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Import them all, or pick the ones you want.</p>

      <div className="mt-4 flex items-center gap-2">
        <Button size="sm">Import all 47 pages</Button>
        <Button variant="outline" size="sm">Select pages</Button>
      </div>

      <div className="mt-4 max-h-[240px] overflow-y-auto rounded-lg border border-border">
        {pages.map((p) => (
          <label key={p} className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-b-0 hover:bg-surface-muted/40">
            <Checkbox defaultChecked />
            <span className="truncate text-sm text-foreground">{url.replace(/\/$/, "")}{p}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
