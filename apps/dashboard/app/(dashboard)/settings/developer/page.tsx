'use client';

import { Button, CodeSnippet, Input, PageHeader } from '@genie/ui';
import { toast } from 'sonner';

export default function DeveloperSettingsPage() {
  return (
    <div>
      <PageHeader
        title="Developer Settings"
        description="API keys, webhooks, and developer tools."
      />

      <div className="max-w-2xl space-y-8">
        <section>
          <h3 className="mb-3 font-semibold">API Keys</h3>
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Use API keys to authenticate requests to the Genie API.
          </p>
          <div className="flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-3">
            <code className="flex-1 text-sm">genie_sk_live_••••••••••••••••</code>
            <Button variant="ghost" size="sm" onClick={() => toast.success('Key copied')}>Copy</Button>
          </div>
          <Button variant="secondary" className="mt-3" size="sm">Generate New Key</Button>
        </section>

        <section>
          <h3 className="mb-3 font-semibold">Webhooks</h3>
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Receive real-time notifications when events occur.
          </p>
          <Input placeholder="https://your-server.com/webhooks/genie" />
          <Button className="mt-3" variant="secondary" size="sm">Add Webhook</Button>
        </section>

        <section>
          <h3 className="mb-3 font-semibold">Quick Start</h3>
          <CodeSnippet
            language="bash"
            code={`curl https://api.genie.ai/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"assistant_id": "asst-1", "message": "Hello"}'`}
          />
        </section>
      </div>
    </div>
  );
}
