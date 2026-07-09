'use client';

import { Button, PageHeader } from '@genie/ui';

export default function SecuritySettingsPage() {
  return (
    <div>
      <PageHeader title="Security" description="Manage security settings for your account." />
      <div className="max-w-lg space-y-6">
        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] p-5">
          <h3 className="font-semibold">Password</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Change your account password.</p>
          <Button variant="secondary" className="mt-4" size="sm">Change Password</Button>
        </section>
        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] p-5">
          <h3 className="font-semibold">Two-Factor Authentication</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Add an extra layer of security to your account.</p>
          <Button variant="secondary" className="mt-4" size="sm">Enable 2FA</Button>
        </section>
      </div>
    </div>
  );
}
