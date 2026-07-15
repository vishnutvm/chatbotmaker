'use client';

import { TopHeader } from '@/components/shell/TopHeader';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Check } from 'lucide-react';

const usage = [
  { label: 'Conversations', used: 1713, limit: 5000 },
  { label: 'AI usage (tokens)', used: 1_900_000, limit: 3_000_000 },
  { label: 'Knowledge storage', used: 420, limit: 2000, unit: 'MB' },
  { label: 'Team members', used: 4, limit: 10 },
];

export default function Billing() {
  return (
    <>
      <TopHeader breadcrumb={<span className="text-foreground">Billing</span>} />
      <div className="mx-auto max-w-[1080px] px-6 py-8 space-y-6">
        <PageHeader
          title="Billing & usage"
          description="Manage your plan, seats and AI usage."
        />

        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-foreground">Growth</span>
                <StatusBadge tone="primary">Current plan</StatusBadge>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Next invoice on Aug 15 · $199 / month
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Manage plan</Button>
              <Button>Upgrade</Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-base font-semibold text-foreground">Usage this month</h2>
          <div className="mt-5 space-y-5">
            {usage.map((u) => {
              const pct = Math.round((u.used / u.limit) * 100);
              return (
                <div key={u.label}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-foreground">{u.label}</span>
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {u.used.toLocaleString()}
                      </span>{' '}
                      / {u.limit.toLocaleString()} {u.unit ?? ''}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className={`h-full rounded-full ${pct > 80 ? 'bg-warning' : 'bg-primary'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-base font-semibold text-foreground">Compare plans</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              {
                name: 'Starter',
                price: '$0',
                features: ['1 assistant', '500 conversations', 'Community support'],
              },
              {
                name: 'Growth',
                price: '$199',
                features: ['10 assistants', '5,000 conversations', 'Email + chat support'],
                current: true,
              },
              {
                name: 'Scale',
                price: 'Contact us',
                features: ['Unlimited assistants', 'Custom limits', 'SSO + SOC 2'],
              },
            ].map((p) => (
              <div
                key={p.name}
                className={`rounded-lg border p-5 ${
                  p.current ? 'border-primary ring-1 ring-primary' : 'border-border'
                }`}
              >
                <div className="text-sm font-semibold text-foreground">{p.name}</div>
                <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                  {p.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}
                    {p.price.startsWith('$') ? '/ month' : ''}
                  </span>
                </div>
                <ul className="mt-4 space-y-1.5 text-sm text-foreground">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-success" /> {f}
                    </li>
                  ))}
                </ul>
                {!p.current && (
                  <Button
                    className="mt-5 w-full"
                    variant={p.name === 'Scale' ? 'outline' : 'default'}
                  >
                    {p.name === 'Scale' ? 'Contact sales' : 'Upgrade'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
