import * as React from 'react';
import { Button } from './ui/button';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--foreground)]">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PageToolbar({ children }: { children: React.ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-center gap-3">{children}</div>;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center">
      <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-[var(--muted-foreground)]">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
  technicalDetails,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
  technicalDetails?: string;
}) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--error)]/20 bg-[var(--error-subtle)] p-6">
      <h3 className="text-base font-semibold text-[var(--error)]">{title}</h3>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{description}</p>
      <div className="mt-4 flex gap-3">
        {onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        ) : null}
        {technicalDetails ? (
          <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? 'Hide' : 'View'} Technical Details
          </Button>
        ) : null}
      </div>
      {showDetails && technicalDetails ? (
        <pre className="mt-4 overflow-auto rounded-md bg-[var(--surface)] p-3 text-xs text-[var(--subtle-foreground)]">
          {technicalDetails}
        </pre>
      ) : null}
    </div>
  );
}

export function ProcessingState({
  title,
  description,
  steps,
}: {
  title: string;
  description?: string;
  steps?: { label: string; status: 'pending' | 'active' | 'complete' | 'error' }[];
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6">
      <h3 className="text-base font-semibold text-[var(--foreground)]">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{description}</p>
      ) : null}
      {steps ? (
        <ul className="mt-4 space-y-3">
          {steps.map((step) => (
            <li key={step.label} className="flex items-center gap-3 text-sm">
              <span
                className={
                  step.status === 'complete'
                    ? 'text-[var(--success)]'
                    : step.status === 'active'
                      ? 'text-[var(--primary)]'
                      : step.status === 'error'
                        ? 'text-[var(--error)]'
                        : 'text-[var(--subtle-foreground)]'
                }
              >
                {step.status === 'complete' ? '✓' : step.status === 'active' ? '●' : '○'}
              </span>
              <span
                className={
                  step.status === 'active'
                    ? 'font-medium text-[var(--foreground)]'
                    : 'text-[var(--muted-foreground)]'
                }
              >
                {step.label}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
