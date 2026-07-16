'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAssistantsClient } from '@genie/api-client';
import { getAccessToken, getApiBaseUrl } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { useWizard } from '@/lib/wizard-context';
import { WizardFooter } from '@/features/dashboard/wizard-footer';
import { Globe, Link as LinkIcon, Code2, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Method = 'website' | 'share' | 'api';

export default function Step() {
  const { draft, reset, hydrated } = useWizard();
  const { activeOrg } = useAuth();
  const [method, setMethod] = useState<Method>('website');
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
          make it live for your team. Public widget embed ships in a later release.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Method
          active={method === 'website'}
          onClick={() => setMethod('website')}
          icon={Globe}
          title="Add to website"
          desc="Widget embed — coming soon."
        />
        <Method
          active={method === 'share'}
          onClick={() => setMethod('share')}
          icon={LinkIcon}
          title="Share a link"
          desc="Public chat link — coming soon."
        />
        <Method
          active={method === 'api'}
          onClick={() => setMethod('api')}
          icon={Code2}
          title="Use the API"
          desc="Org-scoped chat API is live after deploy."
          recommended
        />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface/80 p-6 shadow-ambient backdrop-blur-sm">
        {method === 'website' && (
          <ComingSoon
            title="Website widget"
            body="The public CDN widget ships in Phase 7. For now, deploy to mark this assistant live and test it from the dashboard."
          />
        )}

        {method === 'share' && (
          <ComingSoon
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

function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Coming soon
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Method({
  active,
  onClick,
  icon: Icon,
  title,
  desc,
  recommended,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  recommended?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        active
          ? 'border-primary bg-primary-subtle/40 ring-2 ring-primary/25'
          : 'border-border bg-surface hover:border-border-strong hover:bg-surface-muted/40',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl',
          active ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-foreground',
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        {recommended && (
          <span className="rounded-full bg-primary-subtle px-1.5 py-0.5 text-[10px] font-medium text-primary">
            Recommended
          </span>
        )}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
    </button>
  );
}
