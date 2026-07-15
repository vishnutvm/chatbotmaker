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
import { MoreHorizontal, Plus, Copy, Loader2, Users } from 'lucide-react';

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
  }, [activeOrg, manager]);

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
      <div className="mx-auto max-w-[1080px] px-6 py-8 space-y-6 animate-in fade-in duration-300">
        <PageHeader
          title="Team"
          description={`Manage who has access to ${activeOrg?.name ?? 'your company'}.`}
          actions={
            manager ? (
              <Button
                data-testid="team-invite-open"
                className="rounded-xl shadow-md shadow-primary/10"
                onClick={() => setInviteOpen((v) => !v)}
              >
                <Plus className="mr-1.5 h-4 w-4" /> Invite member
              </Button>
            ) : null
          }
        />

        {inviteOpen && manager ? (
          <form
            onSubmit={onInvite}
            className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-ambient"
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
                  className="mt-1.5 h-10 rounded-xl"
                  placeholder="teammate@company.com"
                />
              </div>
              <div>
                <Label htmlFor="invite-role">Role</Label>
                <select
                  id="invite-role"
                  data-testid="team-invite-role"
                  className="mt-1.5 flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
              <Button type="button" variant="ghost" className="rounded-xl" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                data-testid="team-invite-submit"
                disabled={submitting}
                className="rounded-xl shadow-md shadow-primary/10"
              >
                {submitting ? 'Sending…' : 'Send invite'}
              </Button>
            </div>
          </form>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-ambient">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-sm text-muted-foreground">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-subtle">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
              <span className="font-medium">Loading team…</span>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/70">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">No members yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Invite teammates to collaborate on assistants.</p>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="hidden md:table-cell px-5 py-3">Email</th>
                  <th className="px-5 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((m) => (
                  <tr key={m.userId} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-subtle text-[11px] font-semibold text-primary ring-2 ring-primary/10">
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
                              className="h-8 w-8 rounded-xl"
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
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Pending invitations</h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-ambient divide-y divide-border">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/20"
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
                      className="rounded-xl"
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
                      className="rounded-xl text-destructive hover:bg-destructive-subtle hover:text-destructive"
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
