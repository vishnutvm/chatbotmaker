'use client';

import { AppShell } from '@genie/ui';
import { createAuthClient } from '@genie/api-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  clearAuthSession,
  getAccessToken,
  getApiBaseUrl,
  getRefreshToken,
  getStoredUser,
} from '../lib/auth-session';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState<string | null>(null);
  const user = getStoredUser();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const client = createAuthClient(getApiBaseUrl());
    client
      .me(token)
      .then((me) => {
        setOrgName(me.organizations[0]?.name ?? null);
        setLoading(false);
      })
      .catch(() => {
        clearAuthSession();
        router.replace('/login');
      });
  }, [router]);

  async function handleLogout() {
    const access = getAccessToken();
    const refresh = getRefreshToken();
    if (access && refresh) {
      try {
        await createAuthClient(getApiBaseUrl()).logout(access, refresh);
      } catch {
        // clear local session regardless
      }
    }
    clearAuthSession();
    router.replace('/login');
  }

  if (loading) {
    return (
      <AppShell title="ChatbotMaker Dashboard">
        <p className="text-gray-600">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="ChatbotMaker Dashboard">
      <p className="text-gray-700">
        Welcome{user?.name ? `, ${user.name}` : ''}.
        {orgName ? ` Workspace: ${orgName}.` : ''}
      </p>
      <p className="mt-2 text-sm text-gray-500">Sprint 2 — authenticated dashboard shell.</p>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-6 rounded border border-gray-300 px-4 py-2 text-sm"
      >
        Sign out
      </button>
    </AppShell>
  );
}
