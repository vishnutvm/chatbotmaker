'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@genie/ui';

const SETTINGS_NAV = [
  { href: '/settings', label: 'General' },
  { href: '/settings/team', label: 'Team' },
  { href: '/settings/billing', label: 'Billing' },
  { href: '/settings/security', label: 'Security' },
  { href: '/settings/notifications', label: 'Notifications' },
  { href: '/settings/developer', label: 'Developer' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-8">
      <nav className="hidden w-48 shrink-0 space-y-1 md:block" aria-label="Settings">
        {SETTINGS_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'block rounded-md px-3 py-2 text-sm font-medium',
              pathname === item.href
                ? 'bg-[var(--primary-subtle)] text-[var(--primary)]'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)]',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}
