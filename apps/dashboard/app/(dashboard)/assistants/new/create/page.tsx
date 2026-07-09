'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, PageHeader, cn } from '@genie/ui';
import { PURPOSE_OPTIONS } from '@/lib/mocks/assistants.mock';
import { useWizardStore } from '@/lib/stores/wizard-store';

export default function CreateStepPage() {
  const router = useRouter();
  const { draft, setName, setPurpose, setDescription, completeStep } = useWizardStore();

  function handleContinue() {
    if (!draft.name.trim()) return;
    completeStep('create');
    router.push('/assistants/new/teach');
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Create your AI assistant"
        description="Let's start with the basics. You can change everything later."
      />

      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
            Assistant Name
          </label>
          <Input
            id="name"
            placeholder="e.g. Support Assistant"
            value={draft.name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium">
            What should your assistant help with?
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {PURPOSE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setPurpose(option.id);
                  setDescription(option.description);
                }}
                className={cn(
                  'rounded-[var(--radius-lg)] border p-4 text-left transition-colors',
                  draft.purpose === option.id
                    ? 'border-[var(--primary)] bg-[var(--primary-subtle)]'
                    : 'border-[var(--border)] hover:border-[var(--border-strong)]',
                )}
              >
                <p className="text-sm font-medium">{option.title}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleContinue} disabled={!draft.name.trim()}>
            Continue to Teach →
          </Button>
        </div>
      </div>
    </div>
  );
}
