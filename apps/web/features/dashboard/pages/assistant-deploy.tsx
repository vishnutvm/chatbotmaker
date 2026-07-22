'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { EmbedSnippetPanel } from '@/features/dashboard/components/embed-snippet-panel';
import {
  DeployComingSoonPanel,
  DeployMethodPicker,
  type DeployMethod,
} from '@/features/dashboard/components/deploy-method-picker';
import { useAssistantDetail } from '@/features/dashboard/assistant-detail-context';

export default function Deploy() {
  const params = useParams();
  const assistantId = String(params.assistantId ?? params.id ?? '');
  const { assistant } = useAssistantDetail();
  const isLive = assistant?.status === 'live';
  const [method, setMethod] = useState<DeployMethod>('website');

  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-lg font-bold text-foreground tracking-tight">Deploy</h2>
        <p className="text-xs text-muted-foreground/80 mt-0.5 font-medium">
          Embed your assistant on any website with a copy-paste snippet.
        </p>
      </div>

      <DeployMethodPicker value={method} onChange={setMethod} recommended="website" />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-ambient">
        {method === 'website' && (
          <>
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
          </>
        )}

        {method === 'share' && (
          <DeployComingSoonPanel
            title="Shareable chat link"
            body="Public share URLs are not available yet. Use the website embed or assistants API to reach customers today."
          />
        )}

        {method === 'api' && (
          <>
            <h3 className="text-base font-bold text-foreground tracking-tight">Assistants API</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Chat with this assistant via your org-scoped API (authenticated). A public widget SDK is
              available through the website embed tab.
            </p>
            <div className="mt-4 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
              Endpoint pattern:{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px] text-foreground">
                POST /api/v1/organizations/:orgId/assistants/:id/chat
              </code>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
