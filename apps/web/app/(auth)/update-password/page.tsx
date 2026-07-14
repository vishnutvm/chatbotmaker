'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthLink, AuthShell } from '@/components/auth/auth-shell';
import { mapAuthError } from '@/lib/auth-flow';
import { supabase } from '@/lib/supabase';

function hasEmailIdentity(identities: Array<{ provider?: string }> | undefined): boolean {
  return (identities ?? []).some((i) => i.provider === 'email');
}

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function prepareSession() {
      const queryParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const code = queryParams.get('code');

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (!cancelled) {
            setError(mapAuthError(exchangeError, 'Reset link is invalid or expired.'));
            router.replace('/forgot-password');
          }
          return;
        }
      } else {
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            if (!cancelled) {
              setError(mapAuthError(sessionError, 'Reset link is invalid or expired.'));
              router.replace('/forgot-password');
            }
            return;
          }
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (!cancelled) {
          router.replace('/forgot-password');
        }
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!hasEmailIdentity(user?.identities as Array<{ provider?: string }> | undefined)) {
        if (!cancelled) {
          setError('Password reset is only available for email & password accounts.');
          router.replace('/login');
        }
        return;
      }

      if (!cancelled) {
        setReady(true);
      }
    }

    void prepareSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!hasEmailIdentity(user?.identities as Array<{ provider?: string }> | undefined)) {
        throw new Error('Password reset is only available for email & password accounts.');
      }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      router.replace('/dashboard');
    } catch (err) {
      setError(mapAuthError(err, 'Could not update password'));
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <AuthShell title="Reset password" subtitle="Preparing secure session…" footer={<span>Please wait</span>}>
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Enter a new password for your email account."
      footer={
        <>
          <AuthLink href="/login">Back to sign in</AuthLink>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" data-testid="update-password-form">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="new-password">
            New password
          </label>
          <Input
            id="new-password"
            data-testid="update-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="confirm-password">
            Confirm password
          </label>
          <Input
            id="confirm-password"
            data-testid="update-password-confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-11"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" data-testid="update-password-submit" disabled={loading} className="w-full h-11">
          {loading ? 'Saving…' : 'Update password'}
        </Button>
      </form>
    </AuthShell>
  );
}
