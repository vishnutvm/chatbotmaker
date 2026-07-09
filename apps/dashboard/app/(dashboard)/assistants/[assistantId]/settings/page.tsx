'use client';

import { useParams } from 'next/navigation';
import { CodeSnippet, PageHeader } from '@genie/ui';
import { getAssistantById } from '@/lib/mocks/assistants.mock';

export default function DeploySettingsPage() {
  const params = useParams();
  const assistant = getAssistantById(params.assistantId as string);
  if (!assistant) return null;

  const embedCode = `<script src="https://cdn.genie.ai/widget.js" data-assistant-id="${assistant.id}"></script>`;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader title="Deployment" description="Deploy your assistant to your website or app." />

      <section>
        <h3 className="mb-3 font-semibold">Website Embed</h3>
        <CodeSnippet code={embedCode} />
      </section>

      <section>
        <h3 className="mb-3 font-semibold">Share Link</h3>
        <p className="rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm">
          https://chat.genie.ai/{assistant.id}
        </p>
      </section>

      <details className="rounded-md border border-[var(--border)] p-4">
        <summary className="cursor-pointer text-sm font-medium">Developer Options</summary>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          API keys, webhooks, and SDK documentation available in Developer Settings.
        </p>
      </details>
    </div>
  );
}
