'use client';

import { createAuthClient } from '@genie/api-client';
import { Button, Input } from '@genie/ui';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/lib/auth-session';
import { getSession, supabase } from '@/lib/supabase';

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const onboardOnly = searchParams.get('onboard') === '1';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!onboardOnly) return;
    void getSession().then((session) => {
      if (!session) {
        router.replace('/login');
      }
    });
  }, [onboardOnly, router]);

  async function completeOnboard(accessToken: string, userEmail: string) {
    const client = createAuthClient(getApiBaseUrl());
    await client.onboard(accessToken, {
      name,
      email: userEmail,
      organizationName: organizationName || undefined,
    });
    router.replace('/');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
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
      if (signUpError || !data.session) {
        throw signUpError ?? new Error('Sign up failed');
      }

      await completeOnboard(data.session.access_token, email);
    } catch {
      setError('Could not create account. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[var(--primary)] text-lg font-bold text-white">
            G
          </div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            {onboardOnly ? 'Complete your workspace setup' : 'Create your account'}
          </h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" data-testid="signup-form">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="name">Name</label>
            <Input
              id="name"
              data-testid="signup-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {!onboardOnly ? (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="email">Email</label>
                <Input
                  id="email"
                  data-testid="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="password">Password</label>
                <Input
                  id="password"
                  data-testid="signup-password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          ) : null}
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="org">Workspace name (optional)</label>
            <Input
              id="org"
              data-testid="signup-org"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-[var(--error)]">{error}</p> : null}
          <Button type="submit" data-testid="signup-submit" disabled={loading} className="w-full">
            {loading ? 'Creating…' : onboardOnly ? 'Complete setup' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-[var(--primary)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
