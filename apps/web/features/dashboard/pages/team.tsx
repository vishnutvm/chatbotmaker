'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { TopHeader } from '@/components/shell/TopHeader';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createOrganizationsClient } from '@genie/api-client';
import type { OrganizationInvitationDto, OrganizationMemberDto, OrganizationRole } from '@genie/types';
import { getAccessToken, getApiBaseUrl } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';
import { MoreHorizontal, Plus, Copy, Loader2 } from 'lucide-react';

const roleTone: Record<string, 'primary' | 'info' | 'neutral'> = {
  owner: 'primary',
  admin: 'info',
  member: 'neutral',
};

function canManage(role: OrganizationRole | undefined): boolean {
  return role === 'owner' || role === 'admin';
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

export default function TeamPage() {
  const { user, activeOrg, refresh } = useAuth();
  const [members, setMembers] = useState<OrganizationMemberDto[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [submitting, setSubmitting] = useState(false);

  const manager = canManage(activeOrg?.role);

  const load = useCallback(async () => {
    if (!activeOrg?.id) {
      setMembers([]);
      setInvitations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const client = createOrganizationsClient(getApiBaseUrl());
      const membersRes = await client.listMembers(token, activeOrg.id);
      setMembers(membersRes.members);
      if (manager) {
        const invRes = await client.listInvitations(token, activeOrg.id);
        setInvitations(invRes.invitations);
      } else {
        setInvitations([]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load team');
    } finally {
      setLoading(false);
    }
  }, [activeOrg?.id, manager]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    if (!activeOrg?.id) return;
    setSubmitting(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const client = createOrganizationsClient(getApiBaseUrl());
      const result = await client.inviteMember(token, activeOrg.id, { email: email.trim(), role });
      if (result.status === 'added') {
        toast.success(`${result.member.name} added to the company`);
      } else {
        toast.success('Invitation created — copy the link and send it to them');
        await navigator.clipboard.writeText(result.invitation.inviteUrl).catch(() => undefined);
      }
      setEmail('');
      setInviteOpen(false);
      await load();
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invite failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function changeRole(targetUserId: string, next: 'admin' | 'member') {
    if (!activeOrg?.id) return;
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const client = createOrganizationsClient(getApiBaseUrl());
      await client.updateMember(token, activeOrg.id, targetUserId, { role: next });
      toast.success('Role updated');
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update role');
    }
  }

  async function removeMember(targetUserId: string) {
    if (!activeOrg?.id) return;
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const client = createOrganizationsClient(getApiBaseUrl());
      await client.removeMember(token, activeOrg.id, targetUserId);
      toast.success('Member removed');
      await load();
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove member');
    }
  }

  async function revokeInvite(invitationId: string) {
    if (!activeOrg?.id) return;
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const client = createOrganizationsClient(getApiBaseUrl());
      await client.revokeInvitation(token, activeOrg.id, invitationId);
      toast.success('Invitation revoked');
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not revoke invitation');
    }
  }

  return (
    <>
      <TopHeader breadcrumb={<span className="text-foreground">Team</span>} />
      <div className="mx-auto max-w-[1080px] px-6 py-8 space-y-6">
        <PageHeader
          title="Team"
          description={`Manage who has access to ${activeOrg?.name ?? 'your company'}.`}
          actions={
            manager ? (
              <Button data-testid="team-invite-open" onClick={() => setInviteOpen((v) => !v)}>
                <Plus className="mr-1.5 h-4 w-4" /> Invite member
              </Button>
            ) : null
          }
        />

        {inviteOpen && manager ? (
          <form
            onSubmit={onInvite}
            className="rounded-xl border border-border bg-surface p-5 space-y-4"
            data-testid="team-invite-form"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  data-testid="team-invite-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 h-10"
                  placeholder="teammate@company.com"
                />
              </div>
              <div>
                <Label htmlFor="invite-role">Role</Label>
                <select
                  id="invite-role"
                  data-testid="team-invite-role"
                  className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Existing Genie users are added immediately. New emails get an invite link you can share
              (they sign up with that email, then join).
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="team-invite-submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send invite'}
              </Button>
            </div>
          </form>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading team…
            </div>
          ) : members.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No members yet.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-5 py-2.5">Member</th>
                  <th className="px-5 py-2.5">Role</th>
                  <th className="hidden md:table-cell px-5 py-2.5">Email</th>
                  <th className="px-5 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((m) => (
                  <tr key={m.userId} className="hover:bg-surface-muted/40">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-subtle text-[11px] font-semibold text-primary">
                          {initials(m.name)}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {m.name}
                          {m.userId === user?.id ? (
                            <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                          ) : null}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge tone={roleTone[m.role] ?? 'neutral'}>{m.role}</StatusBadge>
                    </td>
                    <td className="hidden md:table-cell px-5 py-3.5 text-sm text-muted-foreground">
                      {m.email}
                    </td>
                    <td className="px-5 py-3.5">
                      {manager && m.role !== 'owner' ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Member actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {m.role !== 'admin' ? (
                              <DropdownMenuItem onClick={() => void changeRole(m.userId, 'admin')}>
                                Make admin
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => void changeRole(m.userId, 'member')}>
                                Make member
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => void removeMember(m.userId)}
                            >
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {manager && invitations.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Pending invitations</h2>
            <div className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">{inv.email}</div>
                    <div className="text-xs text-muted-foreground">
                      Role: {inv.role} · Expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void navigator.clipboard.writeText(inv.inviteUrl).then(() => {
                          toast.success('Invite link copied');
                        });
                      }}
                    >
                      <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy link
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => void revokeInvite(inv.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
