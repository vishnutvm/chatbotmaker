'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StepProgress, type WizardStepId } from '@genie/ui';

const STEP_MAP: Record<string, WizardStepId> = {
  create: 'create',
  teach: 'teach',
  customize: 'customize',
  test: 'test',
  deploy: 'deploy',
};

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStep = pathname.split('/').pop() ?? 'create';
  const stepId = STEP_MAP[currentStep] ?? 'create';

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] gap-0 lg:gap-8">
      <aside className="hidden w-[240px] shrink-0 lg:block">
        <p className="mb-4 text-xs font-medium uppercase tracking-wide text-[var(--subtle-foreground)]">
          Setup Progress
        </p>
        <StepProgress currentStep={stepId} />
        <div className="mt-6">
          <Link href="/assistants" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            ← Back to Assistants
          </Link>
        </div>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
