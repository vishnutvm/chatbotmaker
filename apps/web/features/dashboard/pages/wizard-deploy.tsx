'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWizard } from '@/lib/wizard-context';
import { WizardFooter } from '@/features/dashboard/wizard-footer';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Globe, Link as LinkIcon, Code2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { addAssistant, addKnowledge } from '@/lib/store';
import { purposes } from '@/lib/mock/data';

type Method = 'website' | 'share' | 'api';

function slugify(name: string) {
  return (name || 'acme').toLowerCase().replace(/\s+/g, '-');
}

export default function Step() {
  const { draft, reset } = useWizard();
  const [method, setMethod] = useState<Method>('website');
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const slug = slugify(draft.name);
  const shareUrl = `https://chat.genie.dev/${slug}`;
  const snippet = `<script async src="https://cdn.genie.dev/widget.js"
  data-assistant="${slug}"></script>`;
  const curl = `curl https://api.genie.dev/v1/assistants/${slug}/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"message":"How do I upgrade?"}'`;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Could not copy — select the text manually');
    }
  };

  const finish = () => {
    const purpose = purposes.find((p) => p.id === draft.purpose);
    const created = addAssistant({
      name: draft.name || 'Untitled assistant',
      description: purpose?.description ?? '',
      purpose: purpose?.title ?? 'Custom Assistant',
      status: 'live',
    });
    if (draft.knowledgeUrl.trim() && draft.importedPages > 0) {
      try {
        const host = new URL(draft.knowledgeUrl).host || draft.knowledgeUrl;
        addKnowledge({
          assistantId: created.id,
          name: host,
          type: 'website',
          pages: draft.importedPages,
        });
      } catch {
        addKnowledge({
          assistantId: created.id,
          name: draft.knowledgeUrl,
          type: 'website',
          pages: draft.importedPages,
        });
      }
    }
    toast.success(`${created.name} deployed`);
    reset();
    router.push(`/dashboard/assistants/${created.id}/overview`);
  };

  return (
    <div className="mx-auto max-w-[880px] px-8 py-10 animate-in fade-in duration-300">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-subtle text-success">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h1 className="font-heading text-[28px] font-semibold tracking-tight text-foreground">
          Your assistant is ready
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Choose how you&apos;d like to deploy{' '}
          <span className="font-medium text-foreground">{draft.name || 'your assistant'}</span>.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Method
          active={method === 'website'}
          onClick={() => setMethod('website')}
          icon={Globe}
          title="Add to website"
          desc="Paste a snippet — 30 seconds."
          recommended
        />
        <Method
          active={method === 'share'}
          onClick={() => setMethod('share')}
          icon={LinkIcon}
          title="Share a link"
          desc="Send a public URL to anyone."
        />
        <Method
          active={method === 'api'}
          onClick={() => setMethod('api')}
          icon={Code2}
          title="Use the API"
          desc="Embed anywhere with our SDK."
        />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface/80 p-6 shadow-ambient backdrop-blur-sm">
        {method === 'website' && (
          <div>
            <h3 className="text-base font-semibold text-foreground">Add the widget to your site</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste this snippet before the closing{' '}
              <code className="rounded bg-surface-muted px-1 py-0.5 text-[11px]">{'</body>'}</code> tag.
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface-muted">
              <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">HTML</span>
                <Button size="sm" variant="ghost" className="h-7 rounded-lg" onClick={() => void copy(snippet)}>
                  {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-foreground">
                {snippet}
              </pre>
            </div>
            <div className="mt-4 rounded-xl bg-surface-muted/60 p-4 text-sm">
              <div className="font-medium text-foreground">Not sure how?</div>
              <p className="mt-1 text-xs text-muted-foreground">
                We have step-by-step guides for WordPress, Webflow, Shopify, Next.js and more.
              </p>
            </div>
          </div>
        )}

        {method === 'share' && (
          <div>
            <h3 className="text-base font-semibold text-foreground">Share a link</h3>
            <p className="mt-1 text-sm text-muted-foreground">Anyone with the link can chat with your assistant.</p>
            <div className="mt-4 flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="h-10 flex-1 rounded-xl border border-border bg-surface-muted px-3 font-mono text-sm text-foreground"
              />
              <Button className="rounded-xl" onClick={() => void copy(shareUrl)}>
                {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />} Copy link
              </Button>
            </div>
          </div>
        )}

        {method === 'api' && (
          <div>
            <h3 className="text-base font-semibold text-foreground">Use the API</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Call your assistant from any backend, or embed with the JS SDK.
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface-muted">
              <div className="border-b border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                cURL
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-foreground">{curl}</pre>
            </div>
          </div>
        )}
      </div>

      <WizardFooter
        backTo="/dashboard/assistants/new/test"
        nextLabel="Finish setup"
        onNext={finish}
      />
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
