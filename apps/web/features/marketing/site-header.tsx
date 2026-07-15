'use client';

import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { useAuth } from '@/providers/auth-provider';

export function SiteHeader() {
  const { user, loading } = useAuth();
  const signedIn = Boolean(user);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/50 backdrop-blur-lg border-b border-zinc-200 dark:border-white/5">
      <div className="container mx-auto flex h-16 items-center justify-end gap-3 px-4 md:px-6">
        <ThemeToggle />
        {!loading && signedIn ? (
          <Link
            href="/dashboard"
            data-testid="header-dashboard-cta"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              data-testid="header-login-cta"
              className="rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              data-testid="header-get-started-cta"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
