'use client';

import { createAuthClient } from '@genie/api-client';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthDivider, AuthLink, AuthShell } from '@/components/auth/auth-shell';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { ensureOnboarded, mapAuthError, resolveDisplayName, routeAfterAuth } from '@/lib/auth-flow';
import { getApiBaseUrl, getSession, supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

/**
 * Email/password + Google signup only.
 * There is no separate "confirm your name" step after login —
 * company provisioning is automatic via ensureOnboarded.
 */
export function SignupForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const searchParams = useSearchParams();
  const finishOnboard = searchParams.get('onboard') === '1';
  const inviteToken = searchParams.get('invite');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(finishOnboard);

  // Legacy /signup?onboard=1 bookmarks: finish silently, never show a name form.
  useEffect(() => {
    if (!finishOnboard) return;

    let cancelled = false;
    void (async () => {
      try {
        const session = await getSession();
        if (!session) {
          router.replace('/login');
          return;
        }
        await ensureOnboarded(session.access_token);
        await refresh();
        if (!cancelled) router.replace('/dashboard');
      } catch (err) {
        if (!cancelled) {
          setFinishing(false);
          setError(mapAuthError(err, 'Could not finish setup. Please sign in again.'));
          router.replace('/login');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [finishOnboard, refresh, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name.trim() || resolveDisplayName({ email, user_metadata: { name } }) } },
      });
      if (signUpError) throw signUpError;

      if (data.user && !data.session) {
        setSuccess('Account created. Check your email to confirm, then sign in.');
        return;
      }
      if (!data.session) throw new Error('Sign up failed');

      const client = createAuthClient(getApiBaseUrl());
      await client.onboard(data.session.access_token, {
        name: name.trim() || resolveDisplayName(data.user),
        email,
      });
      await refresh();
      const routeError = await routeAfterAuth(data.session.access_token, router, { inviteToken });
      if (routeError) throw new Error(routeError);
    } catch (err) {
      const message = mapAuthError(err, 'Could not create account. Email may already be in use.');
      if (message.includes('already set up') || message.includes('already onboarded')) {
        router.replace('/login');
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (finishOnboard || finishing) {
    return (
      <AuthShell title="Signing you in" subtitle="Taking you to your dashboard…" footer={<span>Please wait</span>}>
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
        {error ? <p className="text-sm text-destructive text-center">{error}</p> : null}
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle={
        inviteToken
          ? 'Create an account with the invited email to join the company.'
          : 'Sign up with Google or create an email account.'
      }
      footer={
        <>
          Already have an account?{' '}
          <AuthLink href={inviteToken ? `/login?invite=${encodeURIComponent(inviteToken)}` : '/login'}>
            Sign in
          </AuthLink>
        </>
      }
    >
      <GoogleSignInButton label="Sign up with Google" testId="google-sign-up" onError={setError} />
      <AuthDivider />

      <form onSubmit={onSubmit} className="space-y-4" data-testid="signup-form">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="name">
            Your name
          </label>
          <Input
            id="name"
            data-testid="signup-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            data-testid="signup-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            data-testid="signup-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success ? <p className="text-sm text-success">{success}</p> : null}
        <Button type="submit" data-testid="signup-submit" disabled={loading} className="w-full h-11">
          {loading ? 'Working…' : 'Create account with email'}
        </Button>
      </form>
    </AuthShell>
  );
}
