'use client';

import { useEffect } from 'react';
import { AuthShell } from '@/components/auth/auth-shell';

/** Legacy Supabase redirect path — forwards to /auth/callback with query + hash. */
export default function LegacyAuthCallbackPage() {
  useEffect(() => {
    const target = `/auth/callback${window.location.search}${window.location.hash}`;
    window.location.replace(target);
  }, []);

  return (
    <AuthShell title="Signing you in" subtitle="Redirecting…" footer={<span>Please wait</span>}>
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    </AuthShell>
  );
}
