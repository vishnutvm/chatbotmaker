'use client';

import { Card } from './ui/card';
import { cn } from '../lib/utils';

export function AssistantPreview({
  name,
  welcomeMessage,
  primaryColor = '#6366F1',
  position = 'bottom-right',
  className,
}: {
  name: string;
  welcomeMessage: string;
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left';
  className?: string;
}) {
  return (
    <Card className={cn('relative min-h-[360px] overflow-hidden bg-[var(--surface-secondary)] p-4', className)}>
      <p className="mb-4 text-xs font-medium text-[var(--subtle-foreground)]">Live Preview</p>
      <div className="relative h-[300px] rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)]">
        <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-[var(--subtle-foreground)]">
          Your website preview
        </p>
        <div
          className={cn(
            'absolute bottom-4 flex flex-col gap-2',
            position === 'bottom-right' ? 'right-4 items-end' : 'left-4 items-start',
          )}
        >
          <div className="max-w-[200px] rounded-lg bg-[var(--surface)] px-3 py-2 text-xs shadow-md">
            {welcomeMessage}
          </div>
          <button
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-md"
            style={{ backgroundColor: primaryColor }}
            aria-label={`Open ${name} chat`}
          >
            <span className="text-lg">💬</span>
          </button>
        </div>
      </div>
    </Card>
  );
}
