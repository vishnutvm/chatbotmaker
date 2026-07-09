'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createAuthClient } from '@genie/api-client';
import type { MeResponse } from '@genie/types';
import { getAccessToken, getApiBaseUrl, supabase } from '../supabase';

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
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  async function loadUser() {
    const token = await getAccessToken();
    if (!token) {
      setUser(null);
      setOrganizations([]);
      setLoading(false);
      return;
    }

    const client = createAuthClient(getApiBaseUrl());
    try {
      const me = await client.me(token);
      setUser(me.user);
      setOrganizations(me.organizations);
      if (!activeOrgId && me.organizations[0]) {
        setActiveOrgId(me.organizations[0].id);
      }
    } catch {
      setUser(null);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUser();
  }, []);

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
