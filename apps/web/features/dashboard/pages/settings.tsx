'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopHeader } from '@/components/shell/TopHeader';
import { PageHeader } from '@/components/common/PageHeader';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createAuthClient } from '@genie/api-client';
import { useAuth } from '@/providers/auth-provider';
import { getAccessToken, getApiBaseUrl, supabase } from '@/lib/supabase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type AuthProviderKind = 'email' | 'google' | 'unknown';

function detectAuthProvider(
  identities: Array<{ provider?: string }> | undefined,
): AuthProviderKind {
  const providers = (identities ?? []).map((i) => i.provider).filter(Boolean) as string[];
  if (providers.includes('email')) return 'email';
  if (providers.includes('google')) return 'google';
  return 'unknown';
}

function providerLabel(kind: AuthProviderKind): string {
  if (kind === 'email') return 'Created with email & password';
  if (kind === 'google') return 'Created with Google';
  return 'Created with connected sign-in';
}

export default function Settings() {
  const router = useRouter();
  const { user, refresh, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [authProvider, setAuthProvider] = useState<AuthProviderKind>('unknown');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canChangePassword = authProvider === 'email';
  const nameDirty = useMemo(() => name.trim() !== (user?.name ?? '').trim(), [name, user?.name]);

  useEffect(() => {
    setName(user?.name ?? '');
  }, [user?.name]);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setAuthProvider(detectAuthProvider(data.user?.identities as Array<{ provider?: string }> | undefined));
    });
  }, []);

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Name is required');
      return;
    }
    setSavingName(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const client = createAuthClient(getApiBaseUrl());
      await client.updateProfile(token, { name: trimmed });
      await supabase.auth.updateUser({ data: { name: trimmed } });
      await refresh();
      toast.success('Name updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (!canChangePassword) return;
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const client = createAuthClient(getApiBaseUrl());
      await client.deleteAccount(token);
      await logout();
      toast.success('Account deleted');
      router.replace('/signup');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <TopHeader breadcrumb={<span className="text-foreground">Settings</span>} />
      <div className="mx-auto max-w-[720px] px-6 py-8 space-y-6 animate-in fade-in duration-300">
        <PageHeader title="Settings" description="Manage your personal account." />

        <section className="rounded-xl border border-border bg-surface p-6 sm:p-7 space-y-6">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Profile</h2>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium" htmlFor="settings-name">
              Name
            </Label>
            <Input
              id="settings-name"
              data-testid="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl"
              autoComplete="name"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Email</Label>
            <Input value={user?.email ?? ''} readOnly className="h-11 rounded-xl bg-muted/30" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Account created with</Label>
            <Input value={providerLabel(authProvider)} readOnly className="h-11 rounded-xl bg-muted/30" />
          </div>
          <div className="flex justify-end pt-1">
            <Button
              data-testid="settings-save-name"
              onClick={() => void saveName()}
              disabled={savingName || !nameDirty}
              className="rounded-xl shadow-md shadow-primary/10"
            >
              {savingName ? 'Saving…' : 'Save name'}
            </Button>
          </div>
        </section>

        {canChangePassword ? (
          <section className="rounded-xl border border-border bg-surface p-6 sm:p-7 space-y-6">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">Change password</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Available for email &amp; password accounts only.
              </p>
            </div>
            <form onSubmit={changePassword} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium" htmlFor="settings-new-password">
                  New password
                </Label>
                <Input
                  id="settings-new-password"
                  data-testid="settings-new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium" htmlFor="settings-confirm-password">
                  Confirm new password
                </Label>
                <Input
                  id="settings-confirm-password"
                  data-testid="settings-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 rounded-xl"
                  required
                />
              </div>
              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  data-testid="settings-change-password"
                  disabled={savingPassword}
                  className="rounded-xl shadow-md shadow-primary/10"
                >
                  {savingPassword ? 'Updating…' : 'Update password'}
                </Button>
              </div>
            </form>
          </section>
        ) : (
          <section className="rounded-xl border border-border bg-surface p-6 sm:p-7">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Password</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              You signed in with Google, so password changes are managed in your Google account.
            </p>
          </section>
        )}

        <section className="rounded-xl border border-destructive/20 bg-destructive-subtle/40 p-6 sm:p-7 space-y-5">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">Delete account</h2>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Permanently deletes your Genie account and company data. This cannot be undone.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                data-testid="settings-delete-account"
                disabled={deleting}
                className="rounded-xl font-semibold shadow-md shadow-destructive/20 hover:shadow-lg hover:shadow-destructive/25"
              >
                {deleting ? 'Deleting…' : 'Delete account'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes your profile, company, and access to Genie. You will need to sign up
                  again to return.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  data-testid="settings-delete-confirm"
                  onClick={(e) => {
                    e.preventDefault();
                    void deleteAccount();
                  }}
                >
                  Yes, delete account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </div>
    </>
  );
}
