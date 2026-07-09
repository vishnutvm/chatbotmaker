'use client';

import { useParams } from 'next/navigation';
import { Button, Input, PageHeader, Textarea } from '@genie/ui';
import { getAssistantById } from '@/lib/mocks/assistants.mock';
import { TONE_OPTIONS } from '@/lib/mocks/assistants.mock';
import { toast } from 'sonner';

export default function InstructionsPage() {
  const params = useParams();
  const assistant = getAssistantById(params.assistantId as string);
  if (!assistant) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Instructions"
        description="Define how your assistant should behave and respond."
      />

      <div className="space-y-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Tone</label>
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`rounded-full border px-4 py-1.5 text-sm ${
                  assistant.tone === t.id
                    ? 'border-[var(--primary)] bg-[var(--primary-subtle)] text-[var(--primary)]'
                    : 'border-[var(--border)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="instructions" className="mb-1.5 block text-sm font-medium">
            System Instructions
          </label>
          <Textarea
            id="instructions"
            rows={8}
            defaultValue={assistant.instructions}
            placeholder="You are a helpful assistant…"
          />
        </div>

        <details className="rounded-md border border-[var(--border)] p-4">
          <summary className="cursor-pointer text-sm font-medium">Advanced Settings</summary>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Response length</label>
              <select className="h-10 w-full rounded-md border border-[var(--border)] px-3 text-sm">
                <option>Concise</option>
                <option>Balanced</option>
                <option>Detailed</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Model</label>
              <Input defaultValue="GPT-4o (recommended)" disabled />
            </div>
          </div>
        </details>

        <Button onClick={() => toast.success('Instructions saved')}>Save Changes</Button>
      </div>
    </div>
  );
}
