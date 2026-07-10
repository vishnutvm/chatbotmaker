'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthLink, AuthShell } from '@/components/auth/auth-shell';
import { completeOAuthCallback } from '@/lib/auth-flow';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void completeOAuthCallback(router).then((message) => {
      if (message) {
        setError(message);
      }
    });
  }, [router]);

  if (error) {
    return (
      <AuthShell
        title="Sign in failed"
        subtitle="We could not complete Google sign in."
        footer={
          <>
            <AuthLink href="/login">Back to sign in</AuthLink>
          </>
        }
      >
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Signing you in"
      subtitle="Completing Google authentication…"
      footer={<span>Please wait</span>}
    >
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    </AuthShell>
  );
}
