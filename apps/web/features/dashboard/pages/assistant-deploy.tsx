'use client';

import type { ComponentType } from 'react';
import { useParams } from 'next/navigation';
import { Globe, Link as LinkIcon, Code2 } from 'lucide-react';
import { EmbedSnippetPanel } from '@/features/dashboard/components/embed-snippet-panel';
import { useAssistantDetail } from '@/features/dashboard/assistant-detail-context';

export default function Deploy() {
  const params = useParams();
  const assistantId = String(params.assistantId ?? params.id ?? '');
  const { assistant } = useAssistantDetail();
  const isLive = assistant?.status === 'live';

  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-lg font-bold text-foreground tracking-tight">Deploy</h2>
        <p className="text-xs text-muted-foreground/80 mt-0.5 font-medium">
          Embed your assistant on any website with a copy-paste snippet.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Method icon={Globe} title="Add to website" desc="Copy embed snippet" active />
        <Method icon={LinkIcon} title="Share a link" desc="Coming soon" />
        <Method icon={Code2} title="Use the API" desc="Authenticated chat API" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-ambient">
        <h3 className="text-base font-bold text-foreground tracking-tight">Website embed</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add the Genie widget to your site. Visitors authenticate with your org publishable key (
          <span className="font-mono text-xs">pk_live_…</span>).
        </p>
        <div className="mt-5">
          <EmbedSnippetPanel
            assistantId={assistantId}
            assistantName={assistant?.name}
            requireLive
            isLive={isLive}
          />
        </div>
      </div>
    </div>
  );
}

function Method({
  icon: Icon,
  title,
  desc,
  active,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4.5 transition-all duration-300 shadow-2xs ${
        active
          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
          : 'border-border bg-card hover:border-border-strong hover:bg-muted/10'
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
          active
            ? 'bg-primary text-primary-foreground border-primary/20 shadow-sm'
            : 'bg-muted text-muted-foreground border-border/60'
        }`}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="mt-3.5 text-sm font-bold text-foreground leading-tight">{title}</div>
      <div className="text-xs text-muted-foreground/80 mt-0.75 font-medium">{desc}</div>
    </div>
  );
}
