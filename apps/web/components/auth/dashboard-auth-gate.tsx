'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { ensureOnboarded } from '@/lib/auth-flow';
import { getSession } from '@/lib/supabase';

/**
 * Protects dashboard routes. Never sends users to a "confirm your name" page —
 * auto-provisions the app user/company when needed, then shows the dashboard.
 */
export function DashboardAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, user, refresh } = useAuth();
  const [bootstrapping, setBootstrapping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const session = await getSession();
      if (!session) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      if (loading) return;

      if (user) {
        setBootstrapping(false);
        setError(null);
        return;
      }

      setBootstrapping(true);
      try {
        await ensureOnboarded(session.access_token);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load your account');
        router.replace('/login');
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [loading, user, pathname, router, refresh]);

  if (loading || bootstrapping || !user) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    );
  }

  return <>{children}</>;
}
