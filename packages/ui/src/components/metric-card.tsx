import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';

export function MetricCard({
  label,
  value,
  change,
  className,
}: {
  label: string;
  value: string | number;
  change?: number;
  className?: string;
}) {
  return (
    <Card className={cn('p-5', className)}>
      <CardContent className="p-0">
        <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
        {change !== undefined ? (
          <p
            className={cn(
              'mt-1 text-xs font-medium',
              change >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]',
            )}
          >
            {change >= 0 ? '+' : ''}
            {change}% from last period
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
