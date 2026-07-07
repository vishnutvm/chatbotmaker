import type { AuthResponse } from '@genie/types';

const ACCESS_KEY = 'genie_access_token';
const REFRESH_KEY = 'genie_refresh_token';
const USER_KEY = 'genie_user';

export function saveAuthSession(response: AuthResponse): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_KEY, response.tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, response.tokens.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(response.user));
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): { id: string; email: string; name: string } | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { id: string; email: string; name: string };
  } catch {
    return null;
  }
}

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
}
