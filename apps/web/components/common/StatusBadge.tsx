import { cn } from '@/lib/utils';

type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';

const styles: Record<Tone, string> = {
  success: 'bg-success-subtle text-success',
  warning: 'bg-warning-subtle text-warning',
  error: 'bg-red-50 text-destructive',
  info: 'bg-info-subtle text-info',
  neutral: 'bg-surface-muted text-muted-foreground',
  primary: 'bg-primary-subtle text-primary',
};

export function StatusBadge({
  tone = 'neutral',
  children,
  dot = true,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        styles[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            tone === 'success' && 'bg-success',
            tone === 'warning' && 'bg-warning',
            tone === 'error' && 'bg-destructive',
            tone === 'info' && 'bg-info',
            tone === 'neutral' && 'bg-muted-foreground/60',
            tone === 'primary' && 'bg-primary',
          )}
        />
      )}
      {children}
    </span>
  );
}
