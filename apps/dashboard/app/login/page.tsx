'use client';

import { createAuthClient } from '@genie/api-client';
import { Button, Input } from '@genie/ui';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { AuthDivider, AuthLink, AuthShell } from '@/components/auth/auth-shell';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { mapAuthError, routeAfterAuth } from '@/lib/auth-flow';
import { getApiBaseUrl } from '@/lib/auth-session';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError || !data.session) {
        throw signInError ?? new Error('Sign in failed');
      }

      await routeAfterAuth(data.session.access_token, router);
    } catch (err) {
      setError(mapAuthError(err, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Sign in to Genie"
      subtitle="Manage your AI assistants"
      footer={
        <>
          No account? <AuthLink href="/signup">Create account</AuthLink>
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
          />
        </div>
        {error ? <p className="text-sm text-[var(--error)]">{error}</p> : null}
        <Button type="submit" data-testid="login-submit" disabled={loading} className="w-full">
          {loading ? 'Signing in…' : 'Sign in with email'}
        </Button>
      </form>
    </AuthShell>
  );
}
