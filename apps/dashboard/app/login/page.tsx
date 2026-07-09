'use client';

import { createAuthClient } from '@genie/api-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Button, Input } from '@genie/ui';
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

      const client = createAuthClient(getApiBaseUrl());
      const session = await client.session(data.session.access_token);
      if (!session.onboarded) {
        router.replace('/signup?onboard=1');
        return;
      }

      router.replace('/');
    } catch {
      setError('Invalid email or password');
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
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Sign in to Genie</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Manage your AI assistants
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" data-testid="login-form">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              data-testid="login-email"
              type="email"
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
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-[var(--error)]">{error}</p> : null}
          <Button type="submit" data-testid="login-submit" disabled={loading} className="w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
          No account?{' '}
          <Link href="/signup" className="font-medium text-[var(--primary)] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
