'use client';

import { DashboardShell } from '@genie/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/providers/auth-provider';
import { getAccessToken } from '@/lib/supabase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, user, activeOrg, logout } = useAuth();

  useEffect(() => {
    async function checkAuth() {
      const token = await getAccessToken();
      if (!token) {
        router.replace('/login');
      }
    }
    if (!loading && !user) {
      void checkAuth();
    }
  }, [loading, user, router]);

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
      </div>
    );
  }

  return (
    <DashboardShell
      userName={user?.name}
      userEmail={user?.email}
      orgName={activeOrg?.name}
      onLogout={handleLogout}
    >
      {children}
    </DashboardShell>
  );
}
