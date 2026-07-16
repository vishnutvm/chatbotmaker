'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createAssistantsClient } from '@genie/api-client';
import type { AssistantDto } from '@genie/types';
import { getAccessToken, getApiBaseUrl } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

interface AssistantDetailValue {
  assistant: AssistantDto | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AssistantDetailValue | null>(null);

/** Fetches a single assistant once per `assistantId`/org and shares it with nested tabs. */
export function AssistantDetailProvider({
  assistantId,
  children,
}: {
  assistantId: string;
  children: ReactNode;
}) {
  const { activeOrg } = useAuth();
  const orgId = activeOrg?.id ?? null;
  const [assistant, setAssistant] = useState<AssistantDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!orgId || !assistantId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const client = createAssistantsClient(getApiBaseUrl());
      const result = await client.get(token, orgId, assistantId);
      setAssistant(result);
    } catch (err) {
      setAssistant(null);
      setError(err instanceof Error ? err.message : 'Could not load this assistant');
    } finally {
      setLoading(false);
    }
  }, [orgId, assistantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo<AssistantDetailValue>(
    () => ({ assistant, loading, error, refresh: load }),
    [assistant, loading, error, load],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAssistantDetail() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAssistantDetail must be used inside <AssistantDetailProvider>');
  return ctx;
}
