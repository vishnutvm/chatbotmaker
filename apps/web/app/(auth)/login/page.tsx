'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthDivider, AuthLink, AuthShell } from '@/components/auth/auth-shell';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { mapAuthError, rememberAuthNextPath, routeAfterAuth } from '@/lib/auth-flow';
import { supabase } from '@/lib/supabase';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const nextPath = searchParams.get('next');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    rememberAuthNextPath(nextPath);
  }, [nextPath]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      rememberAuthNextPath(nextPath);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError || !data.session) throw signInError ?? new Error('Sign in failed');
      const routeError = await routeAfterAuth(data.session.access_token, router, {
        inviteToken,
        nextPath,
      });
      if (routeError) throw new Error(routeError);
    } catch (err) {
      setError(mapAuthError(err, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Sign in to Genie"
      subtitle={inviteToken ? 'Sign in to accept your company invitation' : 'Access your AI assistants'}
      footer={
        <>
          No account?{' '}
          <AuthLink href={inviteToken ? `/signup?invite=${encodeURIComponent(inviteToken)}` : '/signup'}>
            Create account
          </AuthLink>
        </>
      }
    >
      <GoogleSignInButton onError={setError} />
      <AuthDivider />
      <form onSubmit={onSubmit} className="space-y-4" data-testid="login-form">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            data-testid="login-email"
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
            data-testid="login-password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
          />
          <div className="mt-2 text-right">
            <AuthLink href="/forgot-password">Forgot password?</AuthLink>
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" data-testid="login-submit" disabled={loading} className="w-full h-11">
          {loading ? 'Signing in…' : 'Sign in with email'}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Sign in" subtitle="Loading…" footer={<span>Please wait</span>}>
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </AuthShell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
