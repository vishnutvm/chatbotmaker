'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { createAuthClient } from '@genie/api-client';
import type { MeResponse } from '@genie/types';
import { getAccessToken, getApiBaseUrl, supabase } from '@/lib/supabase';

interface AuthContextValue {
  loading: boolean;
  user: MeResponse['user'] | null;
  organizations: MeResponse['organizations'];
  activeOrg: MeResponse['organizations'][0] | null;
  setActiveOrgId: (id: string) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<MeResponse['user'] | null>(null);
  const [organizations, setOrganizations] = useState<MeResponse['organizations']>([]);
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('genie.activeOrgId');
  });

  const setActiveOrgId = useCallback((id: string) => {
    setActiveOrgIdState(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('genie.activeOrgId', id);
    }
  }, []);

  const loadUser = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setUser(null);
      setOrganizations([]);
      setLoading(false);
      return;
    }

    const client = createAuthClient(getApiBaseUrl());
    try {
      const session = await client.session(token);
      if (session.onboarded && session.user) {
        setUser(session.user);
        const orgs = session.organizations ?? [];
        setOrganizations(orgs);
        setActiveOrgIdState((current) => {
          const stored =
            typeof window !== 'undefined' ? window.localStorage.getItem('genie.activeOrgId') : null;
          const preferred = current ?? stored;
          if (preferred && orgs.some((o) => o.id === preferred)) {
            return preferred;
          }
          const first = orgs[0]?.id ?? null;
          if (first && typeof window !== 'undefined') {
            window.localStorage.setItem('genie.activeOrgId', first);
          }
          return first;
        });
      } else {
        setUser(null);
        setOrganizations([]);
      }
    } catch {
      setUser(null);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadUser();
    });

    return () => subscription.unsubscribe();
  }, [loadUser]);

  const activeOrg = organizations.find((o) => o.id === activeOrgId) ?? organizations[0] ?? null;

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setOrganizations([]);
  }

  return (
    <AuthContext.Provider
      value={{
        loading,
        user,
        organizations,
        activeOrg,
        setActiveOrgId,
        refresh: loadUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
