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
        prompt: 'consent',
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
): Promise<void> {
  const client = createAuthClient(getApiBaseUrl());
  const session = await client.session(accessToken);

  if (!session.onboarded) {
    router.replace('/signup?onboard=1');
    return;
  }

  router.replace('/');
}

export async function completeOAuthCallback(router: AppRouter): Promise<string | null> {
  const queryParams = new URLSearchParams(window.location.search);
  const code = queryParams.get('code');
  const authError = queryParams.get('error_description') ?? queryParams.get('error');

  if (authError) {
    return decodeURIComponent(authError);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return error.message;
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return 'Could not complete sign in. Please try again.';
  }

  await routeAfterAuth(session.access_token, router);
  return null;
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
