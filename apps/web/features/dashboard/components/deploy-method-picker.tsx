'use client';

import type { ComponentType } from 'react';
import { Globe, Link as LinkIcon, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DeployMethod = 'website' | 'share' | 'api';

const METHODS: Array<{
  id: DeployMethod;
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}> = [
  {
    id: 'website',
    icon: Globe,
    title: 'Add to website',
    desc: 'Copy embed snippet',
  },
  {
    id: 'share',
    icon: LinkIcon,
    title: 'Share a link',
    desc: 'Public chat link — coming soon',
  },
  {
    id: 'api',
    icon: Code2,
    title: 'Use the API',
    desc: 'Org-scoped chat API',
  },
];

export function DeployMethodPicker({
  value,
  onChange,
  recommended = 'website',
}: {
  value: DeployMethod;
  onChange: (method: DeployMethod) => void;
  recommended?: DeployMethod;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3" role="tablist" aria-label="Deploy method">
      {METHODS.map((method) => (
        <DeployMethodCard
          key={method.id}
          active={value === method.id}
          onClick={() => onChange(method.id)}
          icon={method.icon}
          title={method.title}
          desc={method.desc}
          recommended={recommended === method.id}
        />
      ))}
    </div>
  );
}

function DeployMethodCard({
  active,
  onClick,
  icon: Icon,
  title,
  desc,
  recommended,
}: {
  active: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  recommended?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        active
          ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-2xs'
          : 'border-border bg-card hover:border-border-strong hover:bg-muted/10',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl border',
          active
            ? 'bg-primary text-primary-foreground border-primary/20 shadow-sm'
            : 'bg-muted text-muted-foreground border-border/60',
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="text-sm font-bold text-foreground leading-tight">{title}</div>
        {recommended && (
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            Recommended
          </span>
        )}
      </div>
      <div className="mt-0.75 text-xs text-muted-foreground/80 font-medium">{desc}</div>
    </button>
  );
}

export function DeployComingSoonPanel({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Coming soon
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
