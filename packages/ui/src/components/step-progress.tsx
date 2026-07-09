import { cn } from '../lib/utils';

const WIZARD_STEPS = [
  { id: 'create', label: 'Create', href: '/assistants/new/create' },
  { id: 'teach', label: 'Teach', href: '/assistants/new/teach' },
  { id: 'customize', label: 'Customize', href: '/assistants/new/customize' },
  { id: 'test', label: 'Test', href: '/assistants/new/test' },
  { id: 'deploy', label: 'Deploy', href: '/assistants/new/deploy' },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id'];

export function StepProgress({
  currentStep,
  completedSteps = [],
}: {
  currentStep: WizardStepId;
  completedSteps?: WizardStepId[];
}) {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav aria-label="Assistant setup progress" className="space-y-1">
      {WIZARD_STEPS.map((step, index) => {
        const isComplete = completedSteps.includes(step.id) || index < currentIndex;
        const isCurrent = step.id === currentStep;

        return (
          <div
            key={step.id}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm',
              isCurrent && 'bg-[var(--primary-subtle)] text-[var(--primary)]',
              !isCurrent && isComplete && 'text-[var(--foreground)]',
              !isCurrent && !isComplete && 'text-[var(--subtle-foreground)]',
            )}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                isCurrent && 'bg-[var(--primary)] text-white',
                !isCurrent && isComplete && 'bg-[var(--success-subtle)] text-[var(--success)]',
                !isCurrent && !isComplete && 'bg-[var(--surface-elevated)]',
              )}
            >
              {isComplete && !isCurrent ? '✓' : index + 1}
            </span>
            <span className={cn(isCurrent && 'font-medium')}>{step.label}</span>
          </div>
        );
      })}
    </nav>
  );
}

export { WIZARD_STEPS };
