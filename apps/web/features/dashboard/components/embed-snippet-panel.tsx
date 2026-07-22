'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPublishableKeysClient } from '@genie/api-client';
import type { PublicKeyDto } from '@genie/types';
import { AlertTriangle, Copy, KeyRound, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { buildEmbedSnippet, isValidPublishableKey } from '@/lib/embed-snippet';
import { getAccessToken, getApiBaseUrl } from '@/lib/supabase';
import { getWidgetScriptUrl } from '@/lib/widget-config';
import { useAuth } from '@/providers/auth-provider';

const SESSION_KEY_PREFIX = 'genie:pk_live:';

function sessionStorageKey(orgId: string): string {
  return `${SESSION_KEY_PREFIX}${orgId}`;
}

function readStoredKey(orgId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = sessionStorage.getItem(sessionStorageKey(orgId));
    return value && isValidPublishableKey(value) ? value : null;
  } catch {
    return null;
  }
}

function storeKey(orgId: string, key: string): void {
  try {
    sessionStorage.setItem(sessionStorageKey(orgId), key);
  } catch {
    /* quota / private mode */
  }
}

export interface EmbedSnippetPanelProps {
  assistantId: string;
  assistantName?: string;
  /** Hide publishable-key management when assistant is not live yet. */
  requireLive?: boolean;
  isLive?: boolean;
}

export function EmbedSnippetPanel({
  assistantId,
  assistantName,
  requireLive = false,
  isLive = true,
}: EmbedSnippetPanelProps) {
  const { activeOrg } = useAuth();
  const orgId = activeOrg?.id ?? null;

  const [keys, setKeys] = useState<PublicKeyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [plaintextKey, setPlaintextKey] = useState<string | null>(null);
  const [revealedOnce, setRevealedOnce] = useState<string | null>(null);

  const activeKeys = useMemo(() => keys.filter((k) => !k.revokedAt), [keys]);

  const loadKeys = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const client = createPublishableKeysClient(getApiBaseUrl());
      const { keys: listed } = await client.list(token, orgId);
      setKeys(listed);
      const stored = readStoredKey(orgId);
      if (stored) {
        setPlaintextKey(stored);
      }
    } catch (err) {
      setKeys([]);
      setError(err instanceof Error ? err.message : 'Could not load publishable keys');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  async function createKey() {
    if (!orgId) return;
    setCreating(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const client = createPublishableKeysClient(getApiBaseUrl());
      const created = await client.create(token, orgId, {
        name: assistantName ? `${assistantName} embed` : 'Website embed',
      });
      setPlaintextKey(created.key);
      setRevealedOnce(created.key);
      storeKey(orgId, created.key);
      toast.success('Publishable key created — copy your embed snippet now');
      await loadKeys();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create publishable key');
    } finally {
      setCreating(false);
    }
  }

  const snippet = useMemo(() => {
    const apiKey = plaintextKey?.trim();
    if (!apiKey || !isValidPublishableKey(apiKey)) return null;
    try {
      return buildEmbedSnippet({
        widgetScriptUrl: getWidgetScriptUrl(),
        apiKey,
        assistantId,
        apiBaseUrl: getApiBaseUrl(),
        theme: 'auto',
        title: assistantName,
      });
    } catch {
      return null;
    }
  }, [plaintextKey, assistantId, assistantName]);

  async function copySnippet() {
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success('Embed snippet copied to clipboard');
    } catch {
      toast.error('Could not copy — select the snippet and copy manually');
    }
  }

  if (!orgId) {
    return (
      <div
        className="rounded-xl border border-border/80 bg-muted/20 p-6 text-sm text-muted-foreground"
        data-testid="embed-snippet-no-org"
      >
        Select an organization to manage embed keys.
      </div>
    );
  }

  if (requireLive && !isLive) {
    return (
      <div
        className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6"
        data-testid="embed-snippet-not-live"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Deploy your assistant first</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The public widget only works with live assistants. Finish setup and deploy, then return
              here to copy your embed snippet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-muted/20 p-10 text-sm font-medium text-muted-foreground"
        data-testid="embed-snippet-loading"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading publishable keys…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
        data-testid="embed-snippet-error"
      >
        <p className="text-sm font-semibold text-destructive">Could not load embed settings</p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => void loadKeys()}
        >
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  if (!snippet) {
    return (
      <div className="space-y-4" data-testid="embed-snippet-empty">
        <div className="rounded-xl border border-dashed border-border bg-muted/10 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card">
              <KeyRound className="h-5 w-5 text-muted-foreground" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground">
                {activeKeys.length > 0
                  ? 'Create a key to generate your snippet'
                  : 'Create a publishable key'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeKeys.length > 0
                  ? 'Existing keys only show a prefix for security. Create a new publishable key to copy a full embed snippet — store it securely; the full key is shown once.'
                  : 'Publishable keys (pk_live_…) authenticate your widget on customer websites. You need one before copying the embed snippet.'}
              </p>
              {activeKeys.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {activeKeys.map((k) => (
                    <li key={k.id} className="font-mono">
                      {k.name} · {k.keyPrefix}
                    </li>
                  ))}
                </ul>
              )}
              <Button
                type="button"
                size="sm"
                className="mt-4"
                disabled={creating}
                onClick={() => void createKey()}
                data-testid="embed-snippet-create-key"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Creating…
                  </>
                ) : (
                  'Create publishable key'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="embed-snippet-ready">
      {revealedOnce && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          <strong className="font-semibold">Save your key now.</strong> The full publishable key is shown
          only once. If you lose it, create a new key and revoke the old one.
        </div>
      )}

      {activeKeys.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Active keys:{' '}
          {activeKeys.map((k) => (
            <span key={k.id} className="mr-2 font-mono">
              {k.keyPrefix}
            </span>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border/80 bg-muted/20 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
            HTML embed snippet
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7.5 rounded-lg text-xs font-semibold hover:bg-muted/80"
            onClick={() => void copySnippet()}
            data-testid="embed-snippet-copy"
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Copy snippet
          </Button>
        </div>
        <pre
          className="overflow-x-auto p-4 text-[12px] font-mono leading-relaxed text-foreground select-all"
          data-testid="embed-snippet-code"
        >
          {snippet}
        </pre>
      </div>

      <p className="text-xs text-muted-foreground">
        Paste before <code className="rounded bg-muted px-1 py-0.5">&lt;/body&gt;</code> on any site.
        Set <code className="rounded bg-muted px-1 py-0.5">NEXT_PUBLIC_WIDGET_SCRIPT_URL</code> in Vercel
        when your CDN hosts <code className="rounded bg-muted px-1 py-0.5">widget.js</code>.
      </p>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={creating}
        onClick={() => void createKey()}
      >
        {creating ? 'Creating…' : 'Create another key'}
      </Button>
    </div>
  );
}
