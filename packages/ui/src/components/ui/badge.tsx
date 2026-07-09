import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-[var(--primary-subtle)] text-[var(--primary)]',
        live: 'bg-[var(--success-subtle)] text-[var(--success)]',
        draft: 'bg-[var(--surface-elevated)] text-[var(--muted-foreground)]',
        processing: 'bg-[var(--info-subtle)] text-[var(--info)]',
        ready: 'bg-[var(--success-subtle)] text-[var(--success)]',
        failed: 'bg-[var(--error-subtle)] text-[var(--error)]',
        warning: 'bg-[var(--warning-subtle)] text-[var(--warning)]',
        connected: 'bg-[var(--success-subtle)] text-[var(--success)]',
        disconnected: 'bg-[var(--surface-elevated)] text-[var(--muted-foreground)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const variantMap: Record<string, BadgeProps['variant']> = {
    live: 'live',
    draft: 'draft',
    processing: 'processing',
    ready: 'ready',
    failed: 'failed',
    paused: 'warning',
    connected: 'connected',
    disconnected: 'disconnected',
    open: 'processing',
    resolved: 'live',
    assigned: 'default',
    unresolved: 'warning',
  };

  return (
    <Badge variant={variantMap[status] ?? 'default'} className={className}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
