'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAssistantsClient } from '@genie/api-client';
import { getAccessToken, getApiBaseUrl } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { useWizard } from '@/lib/wizard-context';
import { EmbedSnippetPanel } from '@/features/dashboard/components/embed-snippet-panel';
import {
  DeployComingSoonPanel,
  DeployMethodPicker,
  type DeployMethod,
} from '@/features/dashboard/components/deploy-method-picker';
import { WizardFooter } from '@/features/dashboard/wizard-footer';
import { Rocket } from 'lucide-react';
import { toast } from 'sonner';

export default function Step() {
  const { draft, reset, hydrated } = useWizard();
  const { activeOrg } = useAuth();
  const [method, setMethod] = useState<DeployMethod>('website');
  const [deploying, setDeploying] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !draft.assistantId) {
      toast.error('Create your assistant first.');
      router.replace('/dashboard/assistants/new/create');
    }
  }, [hydrated, draft.assistantId, router]);

  async function finish() {
    if (!draft.assistantId || !activeOrg) {
      toast.error('Create your assistant first.');
      router.push('/dashboard/assistants/new/create');
      return;
    }
    setDeploying(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const client = createAssistantsClient(getApiBaseUrl());
      const deployed = await client.deploy(token, activeOrg.id, draft.assistantId);
      toast.success(`${deployed.name} is live`);
      const id = deployed.id;
      reset();
      router.push(`/dashboard/assistants/${id}/overview`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not deploy your assistant');
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div className="mx-auto max-w-[880px] px-8 py-10 animate-in fade-in duration-300">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-subtle text-primary">
          <Rocket className="h-6 w-6" />
        </div>
        <h1 className="font-heading text-[28px] font-semibold tracking-tight text-foreground">
          Deploy your assistant
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Publish{' '}
          <span className="font-medium text-foreground">{draft.name || 'your assistant'}</span> to
          make it live, then copy the website embed snippet below.
        </p>
      </div>

      <DeployMethodPicker value={method} onChange={setMethod} recommended="website" />

      <div className="mt-6 rounded-2xl border border-border bg-surface/80 p-6 shadow-ambient backdrop-blur-sm">
        {method === 'website' && draft.assistantId && (
          <div>
            <div
              className="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground"
              data-testid="wizard-deploy-pre-live-callout"
            >
              <strong className="font-semibold">Snippet will work after you click Go live.</strong>{' '}
              You can prepare your publishable key and copy the embed code now, but the widget only
              responds once this assistant is published.
            </div>
            <h3 className="text-base font-semibold text-foreground">Website widget</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste this snippet on any page. Create a publishable key if you do not have one yet.
            </p>
            <div className="mt-4">
              <EmbedSnippetPanel
                assistantId={draft.assistantId}
                assistantName={draft.name || undefined}
                requireLive={false}
                isLive={false}
              />
            </div>
          </div>
        )}

        {method === 'share' && (
          <DeployComingSoonPanel
            title="Shareable chat link"
            body="Public share URLs are not available yet. Deploy to publish the assistant for your organization, then use Test or the assistants API."
          />
        )}

        {method === 'api' && (
          <div>
            <h3 className="text-base font-semibold text-foreground">Assistants API</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              After you finish setup, chat with this assistant via your org-scoped API (authenticated).
              A public widget SDK comes later.
            </p>
            <div className="mt-4 rounded-xl bg-surface-muted/60 p-4 text-sm text-muted-foreground">
              Endpoint pattern:{' '}
              <code className="rounded bg-surface-muted px-1 py-0.5 text-[11px] text-foreground">
                POST /api/v1/organizations/:orgId/assistants/:id/chat
              </code>
            </div>
          </div>
        )}
      </div>

      <WizardFooter
        backTo="/dashboard/assistants/new/test"
        nextLabel={deploying ? 'Deploying…' : 'Go live'}
        nextDisabled={deploying}
        onNext={finish}
      />
    </div>
  );
}
