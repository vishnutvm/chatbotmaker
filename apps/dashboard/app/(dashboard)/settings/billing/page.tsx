'use client';

import { Button, Card, MetricCard, PageHeader } from '@genie/ui';

const USAGE = [
  { label: 'Conversations', used: 142, limit: 1000 },
  { label: 'AI Usage', used: 45200, limit: 100000, unit: 'tokens' },
  { label: 'Knowledge Storage', used: 24, limit: 100, unit: 'MB' },
  { label: 'Team Members', used: 3, limit: 5 },
];

export default function BillingSettingsPage() {
  return (
    <div>
      <PageHeader title="Billing & Usage" description="Manage your plan and monitor usage." />

      <Card className="mb-8 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-[var(--muted-foreground)]">Current Plan</p>
            <p className="mt-1 text-2xl font-semibold">Pro</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">$79/month · Renews Aug 1, 2026</p>
          </div>
          <Button>Upgrade Plan</Button>
        </div>
      </Card>

      <h3 className="mb-4 text-base font-semibold">Usage This Month</h3>
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {USAGE.map((u) => (
          <Card key={u.label} className="p-5">
            <p className="text-sm text-[var(--muted-foreground)]">{u.label}</p>
            <p className="mt-2 text-xl font-semibold">
              {u.used.toLocaleString()}
              {u.unit ? ` ${u.unit}` : ''}
              <span className="text-sm font-normal text-[var(--subtle-foreground)]">
                {' '}/ {u.limit.toLocaleString()}{u.unit ? ` ${u.unit}` : ''}
              </span>
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-elevated)]">
              <div
                className="h-full rounded-full bg-[var(--primary)]"
                style={{ width: `${Math.min((u.used / u.limit) * 100, 100)}%` }}
              />
            </div>
          </Card>
        ))}
      </div>

      <Card className="border-[var(--primary)]/30 bg-[var(--primary-subtle)] p-5">
        <p className="font-medium text-[var(--primary)]">Need more capacity?</p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Upgrade to Enterprise for unlimited conversations and priority support.
        </p>
        <Button className="mt-4" size="sm">View Plans</Button>
      </Card>
    </div>
  );
}
