'use client';

import { Button, Input, PageHeader } from '@genie/ui';
import { useAuth } from '@/lib/providers/auth-provider';
import { toast } from 'sonner';

export default function GeneralSettingsPage() {
  const { user, activeOrg } = useAuth();

  return (
    <div>
      <PageHeader title="General Settings" description="Manage your organization and profile." />

      <div className="max-w-lg space-y-6">
        <section>
          <h3 className="mb-4 text-base font-semibold">Organization</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Organization Name</label>
              <Input defaultValue={activeOrg?.name ?? ''} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Slug</label>
              <Input defaultValue={activeOrg?.slug ?? ''} />
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-base font-semibold">Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Name</label>
              <Input defaultValue={user?.name ?? ''} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <Input defaultValue={user?.email ?? ''} disabled />
            </div>
          </div>
        </section>

        <Button onClick={() => toast.success('Settings saved')}>Save Changes</Button>
      </div>
    </div>
  );
}
