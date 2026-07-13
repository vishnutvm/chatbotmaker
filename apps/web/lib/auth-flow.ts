import { createAuthClient } from '@genie/api-client';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { getApiBaseUrl, supabase } from './supabase';

export function getAuthCallbackUrl(): string {
  if (typeof window === 'undefined') {
    return '/auth/callback';
  }
  return `${window.location.origin}/auth/callback`;
}

export async function signInWithGoogle(): Promise<void> {
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

export async function routeAfterAuth(
  accessToken: string,
  router: AppRouterInstance,
): Promise<string | null> {
  const client = createAuthClient(getApiBaseUrl());

  try {
    const session = await client.session(accessToken);
    if (!session.onboarded) {
      router.replace('/signup?onboard=1');
      return null;
    }
    router.replace('/dashboard');
    return null;
  } catch {
    return 'Could not reach the API. Verify NEXT_PUBLIC_API_URL and Railway CORS_ORIGINS include this site.';
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
