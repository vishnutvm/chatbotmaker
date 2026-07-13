'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AuthLink, AuthShell } from '@/components/auth/auth-shell';
import { completeOAuthCallback } from '@/lib/auth-flow';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void completeOAuthCallback(router)
      .then((message) => {
        if (message) setError(message);
      })
      .catch(() => {
        setError('Something went wrong during sign in. Please try again from the login page.');
      });
  }, [router]);

  if (error) {
    return (
      <AuthShell title="Sign in failed" subtitle="We could not complete Google sign in." footer={<AuthLink href="/login">Back to sign in</AuthLink>}>
        <p className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Signing you in" subtitle="Completing authentication…" footer={<span>Please wait</span>}>
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    </AuthShell>
  );
}
