'use client';

import { Button, Input, PageHeader, StatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@genie/ui';
import { toast } from 'sonner';

const MEMBERS = [
  { id: '1', name: 'Sarah Chen', email: 'sarah@company.io', role: 'owner' },
  { id: '2', name: 'John Smith', email: 'john@company.io', role: 'admin' },
  { id: '3', name: 'Mike Johnson', email: 'mike@company.io', role: 'member' },
];

export default function TeamSettingsPage() {
  return (
    <div>
      <PageHeader
        title="Team"
        description="Manage team members and their roles."
        action={<Button onClick={() => toast.info('Invite sent')}>Invite Member</Button>}
      />

      <div className="mb-6 max-w-md">
        <label className="mb-1.5 block text-sm font-medium">Invite by email</label>
        <div className="flex gap-2">
          <Input placeholder="colleague@company.com" />
          <Button variant="secondary">Send Invite</Button>
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {MEMBERS.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell className="text-[var(--muted-foreground)]">{m.email}</TableCell>
                <TableCell>
                  <StatusBadge status={m.role} />
                </TableCell>
                <TableCell>
                  {m.role !== 'owner' ? (
                    <Button variant="ghost" size="sm">Remove</Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
