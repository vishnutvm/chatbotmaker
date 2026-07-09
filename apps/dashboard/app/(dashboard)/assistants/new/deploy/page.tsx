'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AssistantPreview,
  Button,
  CodeSnippet,
  PageHeader,
} from '@genie/ui';
import type { Assistant } from '@genie/types';
import { addAssistant } from '@/lib/mocks/assistants.mock';
import { useWizardStore } from '@/lib/stores/wizard-store';
import { toast } from 'sonner';

const EMBED_CODE = `<script src="https://cdn.genie.ai/widget.js" data-assistant-id="YOUR_ASSISTANT_ID"></script>`;

export default function DeployStepPage() {
  const router = useRouter();
  const { draft, completeStep, reset } = useWizardStore();

  function handleFinish() {
    const assistant: Assistant = {
      id: `asst-${Date.now()}`,
      name: draft.name,
      description: draft.description,
      purpose: draft.purpose,
      status: 'live',
      welcomeMessage: draft.welcomeMessage,
      tone: draft.tone,
      instructions: draft.instructions,
      knowledgeSourceCount: draft.knowledgeSources.length,
      conversationCount: 0,
      lastActivityAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      deployed: true,
      appearance: draft.appearance,
    };
    addAssistant(assistant);
    completeStep('deploy');
    reset();
    toast.success('Assistant deployed successfully!');
    router.push(`/assistants/${assistant.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 rounded-[var(--radius-lg)] border border-[var(--success)]/30 bg-[var(--success-subtle)] p-6 text-center">
        <h2 className="text-xl font-semibold text-[var(--success)]">Your assistant is ready!</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {draft.name} is configured and ready to deploy.
        </p>
      </div>

      <PageHeader title="Deploy your assistant" />

      <div className="space-y-8">
        <section>
          <h3 className="mb-3 text-base font-semibold">Add to Website</h3>
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Copy this code and paste it before the closing {'</body>'} tag on your website.
          </p>
          <CodeSnippet code={EMBED_CODE} />
          <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
            <p className="text-sm font-medium">Installation Instructions</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[var(--muted-foreground)]">
              <li>Copy the code snippet above</li>
              <li>Open your website&apos;s HTML editor</li>
              <li>Paste before the closing body tag</li>
              <li>Save and publish your changes</li>
            </ol>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-5">
            <h3 className="font-semibold">Share Link</h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Share a direct link to chat with your assistant.
            </p>
            <InputReadonly value="https://chat.genie.ai/your-assistant" />
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-5">
            <h3 className="font-semibold">Use API</h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Integrate via REST API or JavaScript SDK.
            </p>
            <Button variant="secondary" size="sm" className="mt-3">
              View API Docs
            </Button>
          </div>
        </section>

        <details className="rounded-md border border-[var(--border)] p-4">
          <summary className="cursor-pointer text-sm font-medium">Developer Options</summary>
          <div className="mt-4 space-y-2 text-sm text-[var(--muted-foreground)]">
            <p>JavaScript SDK, REST API, API Keys</p>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/settings/developer">Go to Developer Settings</Link>
            </Button>
          </div>
        </details>

        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={() => router.push('/assistants/new/test')}>
            ← Back
          </Button>
          <Button onClick={handleFinish}>Finish Setup</Button>
        </div>
      </div>

      <div className="mt-8 hidden xl:block">
        <AssistantPreview
          name={draft.name}
          welcomeMessage={draft.welcomeMessage}
          primaryColor={draft.appearance.primaryColor}
        />
      </div>
    </div>
  );
}

function InputReadonly({ value }: { value: string }) {
  return (
    <div className="mt-3 flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2">
      <code className="flex-1 truncate text-xs">{value}</code>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          void navigator.clipboard.writeText(value);
          toast.success('Link copied');
        }}
      >
        Copy
      </Button>
    </div>
  );
}
