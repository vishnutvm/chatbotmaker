import { createAuthClient } from '@genie/api-client';
import type { useRouter } from 'next/navigation';
import { getApiBaseUrl, supabase } from './supabase';

type AppRouter = ReturnType<typeof useRouter>;

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
  router: AppRouter,
): Promise<string | null> {
  const client = createAuthClient(getApiBaseUrl());

  try {
    const session = await client.session(accessToken);
    if (!session.onboarded) {
      router.replace('/signup?onboard=1');
      return null;
    }
    router.replace('/');
    return null;
  } catch {
    // Supabase auth succeeded but API check failed — still allow onboard flow.
    router.replace('/signup?onboard=1');
    return null;
  }
}

export async function completeOAuthCallback(router: AppRouter): Promise<string | null> {
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
      return 'Sign in callback was empty. In Supabase URL Configuration, set Redirect URLs to https://chatbotmaker-dashboard-seven.vercel.app/auth/callback and try Google sign in again.';
    }
    return 'Could not complete sign in. Please try again.';
  }

  return routeAfterAuth(session.access_token, router);
}

function mapOAuthCallbackError(message: string): string {
  if (message.includes('invalid_client') || message.includes('Unable to exchange external code')) {
    return 'Google sign in is misconfigured. In Supabase, re-enter the Google Client ID and Client Secret from Google Cloud Console, then try again.';
  }

  if (message.includes('OAuth state parameter missing')) {
    return 'Sign in session expired. Please start Google sign in again.';
  }

  if (message.includes('code challenge') || message.includes('code verifier')) {
    return 'Sign in session expired. Close this tab, return to login, and try Google sign in again.';
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

  return message || fallback;
}
