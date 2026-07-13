'use client';

import { createAuthClient } from '@genie/api-client';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthDivider, AuthLink, AuthShell } from '@/components/auth/auth-shell';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { mapAuthError } from '@/lib/auth-flow';
import { getApiBaseUrl, getSession, supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export function SignupForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const searchParams = useSearchParams();
  const onboardOnly = searchParams.get('onboard') === '1';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!onboardOnly) return;
    void getSession().then((session) => {
      if (!session) {
        router.replace('/login');
        return;
      }
      const metadata = session.user.user_metadata as { name?: string; full_name?: string };
      setName((current) => current || metadata.name || metadata.full_name || '');
      setEmail(session.user.email ?? '');
    });
  }, [onboardOnly, router]);

  async function completeOnboard(accessToken: string, userEmail: string) {
    const client = createAuthClient(getApiBaseUrl());
    await client.onboard(accessToken, {
      name,
      email: userEmail,
      organizationName: organizationName || undefined,
    });
    await refresh();
    router.replace('/dashboard');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (onboardOnly) {
        const session = await getSession();
        if (!session) throw new Error('No session');
        await completeOnboard(session.access_token, session.user.email ?? email);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (signUpError) throw signUpError;

      if (data.user && !data.session) {
        setSuccess('Account created. Check your email to confirm, then sign in.');
        return;
      }
      if (!data.session) throw new Error('Sign up failed');

      await completeOnboard(data.session.access_token, email);
    } catch (err) {
      setError(mapAuthError(err, 'Could not create account. Email may already be in use.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={onboardOnly ? 'Complete your workspace setup' : 'Create your account'}
      subtitle={
        onboardOnly
          ? 'Tell us a bit about your workspace to finish setup.'
          : 'Sign up with Google or create an email account.'
      }
      footer={
        <>
          Already have an account? <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
      {!onboardOnly ? (
        <>
          <GoogleSignInButton label="Sign up with Google" testId="google-sign-up" onError={setError} />
          <AuthDivider />
        </>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4" data-testid="signup-form">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="name">
            Name
          </label>
          <Input id="name" data-testid="signup-name" required value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
        </div>
        {!onboardOnly ? (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input id="email" data-testid="signup-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input id="password" data-testid="signup-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
            </div>
          </>
        ) : null}
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="org">
            Workspace name (optional)
          </label>
          <Input id="org" data-testid="signup-org" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} className="h-11" />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success ? <p className="text-sm text-success">{success}</p> : null}
        <Button type="submit" data-testid="signup-submit" disabled={loading} className="w-full h-11">
          {loading ? 'Creating…' : onboardOnly ? 'Complete setup' : 'Create account with email'}
        </Button>
      </form>
    </AuthShell>
  );
}
