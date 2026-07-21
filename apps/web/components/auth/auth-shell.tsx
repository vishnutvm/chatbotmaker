import Link from 'next/link';
import type { ReactNode } from 'react';
import { GenieLogo } from '@/components/brand/GenieLogo';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
      <div className="mb-8 text-center">
        <GenieLogo className="mx-auto mb-4 h-10 w-10 text-[#5A5CE6]" />
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {children}
      <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-surface px-2 text-muted-foreground">or</span>
      </div>
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-primary hover:underline">
      {children}
    </Link>
  );
}
