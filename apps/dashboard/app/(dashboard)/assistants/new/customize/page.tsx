'use client';

import { useRouter } from 'next/navigation';
import {
  AssistantPreview,
  Button,
  Input,
  PageHeader,
  Textarea,
} from '@genie/ui';
import { TONE_OPTIONS } from '@/lib/mocks/assistants.mock';
import { useWizardStore } from '@/lib/stores/wizard-store';
import { cn } from '@genie/ui';

export default function CustomizeStepPage() {
  const router = useRouter();
  const {
    draft,
    setWelcomeMessage,
    setTone,
    setInstructions,
    setAppearance,
    completeStep,
  } = useWizardStore();

  function handleContinue() {
    completeStep('customize');
    router.push('/assistants/new/test');
  }

  return (
    <div className="flex gap-8">
      <div className="flex-1">
        <PageHeader title="Customize your assistant" />

        <div className="space-y-6">
          <div>
            <label htmlFor="welcome" className="mb-1.5 block text-sm font-medium">
              Welcome Message
            </label>
            <Input
              id="welcome"
              value={draft.welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium">Personality / Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((tone) => (
                <button
                  key={tone.id}
                  type="button"
                  onClick={() => setTone(tone.id)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                    draft.tone === tone.id
                      ? 'border-[var(--primary)] bg-[var(--primary-subtle)] text-[var(--primary)]'
                      : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--border-strong)]',
                  )}
                >
                  {tone.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="instructions" className="mb-1.5 block text-sm font-medium">
              Primary Instructions
            </label>
            <Textarea
              id="instructions"
              rows={5}
              placeholder="Tell your assistant how to behave and what to focus on…"
              value={draft.instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          <details className="rounded-md border border-[var(--border)] p-4">
            <summary className="cursor-pointer text-sm font-medium text-[var(--muted-foreground)]">
              Advanced Settings
            </summary>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="color" className="mb-1.5 block text-sm font-medium">
                  Widget Color
                </label>
                <Input
                  id="color"
                  type="color"
                  value={draft.appearance.primaryColor}
                  onChange={(e) => setAppearance({ primaryColor: e.target.value })}
                  className="h-10 w-20"
                />
              </div>
            </div>
          </details>

          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={() => router.push('/assistants/new/teach')}>
              ← Back
            </Button>
            <Button onClick={handleContinue}>Continue to Test →</Button>
          </div>
        </div>
      </div>

      <aside className="hidden w-[280px] shrink-0 xl:block">
        <AssistantPreview
          name={draft.name || 'Your Assistant'}
          welcomeMessage={draft.welcomeMessage}
          primaryColor={draft.appearance.primaryColor}
          position={draft.appearance.position}
        />
      </aside>
    </div>
  );
}
