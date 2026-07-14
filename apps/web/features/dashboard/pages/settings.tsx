'use client';

import { useEffect, useState } from 'react';
import { TopHeader } from '@/components/shell/TopHeader';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { createOrganizationsClient } from '@genie/api-client';
import type { OrganizationMemberDto } from '@genie/types';
import { useAuth } from '@/providers/auth-provider';
import { getAccessToken, getApiBaseUrl } from '@/lib/supabase';

export default function Settings() {
  const { user, activeOrg, refresh } = useAuth();
  const [showKey, setShowKey] = useState(false);
  const [orgName, setOrgName] = useState(activeOrg?.name ?? '');
  const [savingOrg, setSavingOrg] = useState(false);
  const [members, setMembers] = useState<OrganizationMemberDto[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    setOrgName(activeOrg?.name ?? '');
  }, [activeOrg?.id, activeOrg?.name]);

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      if (!activeOrg) {
        setMembers([]);
        return;
      }
      setMembersLoading(true);
      try {
        const token = await getAccessToken();
        if (!token) return;
        const client = createOrganizationsClient(getApiBaseUrl());
        const result = await client.listMembers(token, activeOrg.id);
        if (!cancelled) setMembers(result.members);
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Failed to load members');
        }
      } finally {
        if (!cancelled) setMembersLoading(false);
      }
    }

    void loadMembers();
    return () => {
      cancelled = true;
    };
  }, [activeOrg?.id]);

  async function saveOrganization() {
    if (!activeOrg) return;
    setSavingOrg(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const client = createOrganizationsClient(getApiBaseUrl());
      await client.update(token, activeOrg.id, { name: orgName.trim() });
      await refresh();
      toast.success('Organization updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update organization');
    } finally {
      setSavingOrg(false);
    }
  }

  const canManageOrg = activeOrg?.role === 'owner' || activeOrg?.role === 'admin';

  return (
    <>
      <TopHeader breadcrumb={<span className="text-foreground">Settings</span>} />
      <div className="mx-auto max-w-[1080px] px-6 py-8 space-y-6">
        <PageHeader title="Settings" description="Preferences that apply to this workspace." />

        <Tabs defaultValue="general">
          <TabsList className="bg-surface-muted h-9">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="developer">Developer</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6">
            <div className="rounded-xl border border-border bg-surface p-6 max-w-2xl space-y-5">
              <h2 className="text-base font-semibold text-foreground">Profile</h2>
              <div>
                <Label className="text-sm font-medium">Full name</Label>
                <Input value={user?.name ?? ''} readOnly className="mt-2 h-10" />
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <Input value={user?.email ?? ''} readOnly className="mt-2 h-10" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="organization" className="mt-6">
            <div className="rounded-xl border border-border bg-surface p-6 max-w-2xl space-y-5">
              <h2 className="text-base font-semibold text-foreground">Organization</h2>
              {!activeOrg ? (
                <p className="text-sm text-muted-foreground">No active organization.</p>
              ) : (
                <>
                  <div>
                    <Label className="text-sm font-medium">Workspace name</Label>
                    <Input
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      disabled={!canManageOrg}
                      className="mt-2 h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Slug</Label>
                    <Input value={activeOrg.slug} readOnly className="mt-2 h-10 font-mono" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Your role</Label>
                    <Input value={activeOrg.role} readOnly className="mt-2 h-10 capitalize" />
                  </div>
                  {canManageOrg ? (
                    <div className="flex justify-end">
                      <Button onClick={() => void saveOrganization()} disabled={savingOrg}>
                        {savingOrg ? 'Saving…' : 'Save changes'}
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <div className="rounded-xl border border-border bg-surface p-6 max-w-2xl space-y-4 mt-6">
              <h2 className="text-base font-semibold text-foreground">Members</h2>
              {membersLoading ? (
                <p className="text-sm text-muted-foreground">Loading members…</p>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members found.</p>
              ) : (
                <ul className="space-y-3">
                  {members.map((member) => (
                    <li
                      key={member.userId}
                      className="flex items-center justify-between border-t border-border pt-3 first:border-t-0 first:pt-0"
                    >
                      <div>
                        <div className="text-sm font-medium text-foreground">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {member.role}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <div className="rounded-xl border border-border bg-surface p-6 max-w-2xl space-y-5">
              <h2 className="text-base font-semibold text-foreground">Security</h2>
              <Row title="Two-factor authentication" desc="Require a code from your authenticator app." defaultOn />
              <Row title="Single sign-on (SSO)" desc="SAML SSO — Scale plan only." />
              <Row title="Session timeout" desc="Sign users out after 30 minutes of inactivity." defaultOn />
            </div>
          </TabsContent>

          <TabsContent value="developer" className="mt-6">
            <div className="rounded-xl border border-border bg-surface p-6 max-w-2xl space-y-5">
              <h2 className="text-base font-semibold text-foreground">API keys</h2>
              <div>
                <Label className="text-sm font-medium">Publishable key</Label>
                <div className="mt-2 flex gap-2">
                  <Input readOnly value="pk_live_a4f2c8e91b7d3f5a" className="h-10 font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => {
                      navigator.clipboard.writeText('pk_live_a4f2c8e91b7d3f5a');
                      toast.success('Copied');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Secret key</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    readOnly
                    type={showKey ? 'text' : 'password'}
                    value="sk_live_9e8b1c4a7f2d6e0b"
                    className="h-10 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => setShowKey((v) => !v)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => {
                      navigator.clipboard.writeText('sk_live_9e8b1c4a7f2d6e0b');
                      toast.success('Copied');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Never share this key. Rotate immediately if exposed.
                </p>
              </div>
              <div className="flex justify-between border-t border-border pt-4">
                <Button variant="outline">Rotate key</Button>
                <Button variant="outline">Create new key</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <div className="rounded-xl border border-border bg-surface p-6 max-w-2xl space-y-5">
              <h2 className="text-base font-semibold text-foreground">Email notifications</h2>
              <Row title="Weekly performance report" desc="Every Monday morning." defaultOn />
              <Row title="Unanswered questions" desc="When 5+ questions can't be answered." defaultOn />
              <Row title="Billing alerts" desc="Approaching usage limits." defaultOn />
              <Row title="Product news" desc="New features and updates." />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function Row({ title, desc, defaultOn }: { title: string; desc: string; defaultOn?: boolean }) {
  return (
    <div className="flex items-center justify-between border-t border-border pt-4 first:border-t-0 first:pt-0">
      <div>
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch defaultChecked={defaultOn} />
    </div>
  );
}
