import { createAuthClient, createOrganizationsClient } from '@genie/api-client';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { getApiBaseUrl, supabase } from './supabase';

const AUTH_NEXT_STORAGE_KEY = 'genie.auth.next';

export function getAuthCallbackUrl(): string {
  if (typeof window === 'undefined') {
    return '/auth/callback';
  }
  return `${window.location.origin}/auth/callback`;
}

/**
 * Only allow same-origin relative app paths (open-redirect safe).
 * Accepts dashboard + invite return targets used by auth gates.
 */
export function resolveSafeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let path = raw.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return null;
  }
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') || path.includes('://')) {
    return null;
  }
  if (!(path.startsWith('/dashboard') || path.startsWith('/invite'))) {
    return null;
  }
  return path;
}

export function rememberAuthNextPath(raw: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  const safe = resolveSafeNextPath(raw);
  if (safe) {
    sessionStorage.setItem(AUTH_NEXT_STORAGE_KEY, safe);
  } else {
    sessionStorage.removeItem(AUTH_NEXT_STORAGE_KEY);
  }
}

export function consumeAuthNextPath(): string | null {
  if (typeof window === 'undefined') return null;
  const stored = sessionStorage.getItem(AUTH_NEXT_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_NEXT_STORAGE_KEY);
  return resolveSafeNextPath(stored);
}

export async function signInWithGoogle(): Promise<void> {
  // Preserve ?next= across the OAuth round-trip (callback URL stays allowlisted).
  if (typeof window !== 'undefined') {
    const next = new URLSearchParams(window.location.search).get('next');
    rememberAuthNextPath(next);
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getAuthCallbackUrl(),
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    throw error;
  }
}

/** Best-effort display name from Supabase user metadata / email — never ask the user on a separate page. */
export function resolveDisplayName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
} | null): string {
  const metadata = (user?.user_metadata ?? {}) as { name?: string; full_name?: string };
  const fromMeta = (metadata.name || metadata.full_name || '').trim();
  if (fromMeta) return fromMeta;
  const email = (user?.email ?? '').trim();
  if (email.includes('@')) return email.split('@')[0] || 'User';
  return 'User';
}

function isAlreadyOnboardedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('already onboarded') ||
    message.includes('already registered') ||
    message.includes('Email already')
  );
}

/**
 * Ensure Nest app user + sole company exist. Never redirects to a name form —
 * always derives the name and treats "already onboarded" as success.
 */
export async function ensureOnboarded(accessToken: string): Promise<void> {
  const client = createAuthClient(getApiBaseUrl());
  const session = await client.session(accessToken);
  if (session.onboarded) {
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    await client.onboard(accessToken, {
      name: resolveDisplayName(user),
      email: user?.email ?? undefined,
    });
  } catch (error) {
    if (isAlreadyOnboardedError(error)) {
      return;
    }
    throw error;
  }
}

export async function routeAfterAuth(
  accessToken: string,
  router: AppRouterInstance,
  options?: { inviteToken?: string | null; nextPath?: string | null },
): Promise<string | null> {
  try {
    await ensureOnboarded(accessToken);

    const inviteToken = options?.inviteToken?.trim();
    if (inviteToken) {
      try {
        const orgs = createOrganizationsClient(getApiBaseUrl());
        await orgs.acceptInvitation(accessToken, { token: inviteToken });
        router.replace('/dashboard/team');
        return null;
      } catch {
        router.replace(`/invite/${encodeURIComponent(inviteToken)}`);
        return null;
      }
    }

    const next =
      resolveSafeNextPath(options?.nextPath) ??
      consumeAuthNextPath() ??
      '/dashboard';
    router.replace(next);
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('Network error') || message.includes('CORS') || message.includes('Could not reach')) {
      return 'Could not reach the API. Verify NEXT_PUBLIC_API_URL and Railway CORS_ORIGINS include this site.';
    }
    return mapAuthError(error, 'Could not finish sign in. Please try again.');
  }
}

export async function completeOAuthCallback(router: AppRouterInstance): Promise<string | null> {
  const queryParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const code = queryParams.get('code');
  const authError =
    queryParams.get('error_description') ??
    queryParams.get('error') ??
    hashParams.get('error_description') ??
    hashParams.get('error');

  if (authError) {
    return mapOAuthCallbackError(decodeURIComponent(authError));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return mapOAuthCallbackError(error.message);
    }
  } else {
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) {
        return mapOAuthCallbackError(error.message);
      }
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    if (!code && !hashParams.get('access_token')) {
      return 'Sign in callback was empty. Check Supabase redirect URLs and try again.';
    }
    return 'Could not complete sign in. Please try again.';
  }

  return routeAfterAuth(session.access_token, router);
}

function mapOAuthCallbackError(message: string): string {
  if (message.includes('invalid_client') || message.includes('Unable to exchange external code')) {
    return 'Google sign in is misconfigured. Re-enter Google Client ID and Secret in Supabase.';
  }
  if (message.includes('OAuth state parameter missing')) {
    return 'Sign in session expired. Please start Google sign in again.';
  }
  if (message.includes('code challenge') || message.includes('code verifier')) {
    return 'Sign in session expired. Return to login and try again.';
  }
  return message;
}

export function mapAuthError(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return fallback;
  }

  const message = String((error as { message: string }).message);

  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. If you just signed up, confirm your email first.';
  }
  if (message.includes('User already registered')) {
    return 'An account with this email already exists. Sign in instead.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Please confirm your email before signing in.';
  }
  if (message.includes('Network error') || message.includes('CORS')) {
    return message;
  }
  if (message.includes('User already onboarded') || message.includes('already onboarded')) {
    return 'Account already set up. Try signing in again.';
  }

  return message || fallback;
}
