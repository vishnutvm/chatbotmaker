import Link from 'next/link';
import type { ReactNode } from 'react';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[var(--primary)] text-lg font-bold text-white">
            G
          </div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{subtitle}</p>
          ) : null}
        </div>

        {children}

        <div className="mt-6 text-center text-sm text-[var(--muted-foreground)]">{footer}</div>
      </div>
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-[var(--border)]" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-[var(--background)] px-2 text-[var(--muted-foreground)]">or</span>
      </div>
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-[var(--primary)] hover:underline">
      {children}
    </Link>
  );
}
