import Link from 'next/link';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

export function InsightCard({
  type,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: {
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  className?: string;
}) {
  const borderColor = {
    warning: 'border-[var(--warning)]/30',
    info: 'border-[var(--info)]/30',
    success: 'border-[var(--success)]/30',
  }[type];

  return (
    <Card className={cn('p-4', borderColor, className)}>
      <CardContent className="flex items-start justify-between gap-4 p-0">
        <div>
          <h4 className="text-sm font-semibold text-[var(--foreground)]">{title}</h4>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{description}</p>
        </div>
        <Button variant="secondary" size="sm" asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function IntegrationCard({
  name,
  description,
  connected,
  onConnect,
}: {
  name: string;
  description: string;
  connected: boolean;
  onConnect?: () => void;
}) {
  return (
    <Card className="p-5">
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">{name}</h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{description}</p>
          </div>
          <Button
            variant={connected ? 'secondary' : 'default'}
            size="sm"
            onClick={onConnect}
            disabled={connected}
          >
            {connected ? 'Connected' : 'Connect'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
