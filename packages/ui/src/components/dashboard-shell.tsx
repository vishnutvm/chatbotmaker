'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Bot,
  ChevronDown,
  HelpCircle,
  Home,
  MessageSquare,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

const PRIMARY_NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/assistants', label: 'Assistants', icon: Bot },
  { href: '/conversations', label: 'Conversations', icon: MessageSquare },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
] as const;

const BOTTOM_NAV = [
  { href: '/help', label: 'Help', icon: HelpCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

export interface DashboardShellProps {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
  orgName?: string;
  orgs?: { id: string; name: string }[];
  onOrgChange?: (orgId: string) => void;
  onLogout?: () => void;
  header?: React.ReactNode;
}

export function DashboardShell({
  children,
  userName = 'User',
  userEmail,
  orgName = 'My Company',
  orgs = [],
  onLogout,
  header,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <>
      <div className="flex h-[var(--header-height)] items-center gap-2 border-b border-[var(--border)] px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--primary)] text-sm font-bold text-white">
          G
        </div>
        {!collapsed ? (
          <span className="font-semibold text-[var(--foreground)]">Genie</span>
        ) : null}
        <button
          type="button"
          className="ml-auto md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        >
          <X className="h-5 w-5 text-[var(--muted-foreground)]" />
        </button>
      </div>

      {!collapsed ? (
        <div className="border-b border-[var(--border)] p-3">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface-secondary)]"
          >
            <span className="truncate font-medium">{orgName}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-[var(--subtle-foreground)]" />
          </button>
        </div>
      ) : null}

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main navigation">
        {PRIMARY_NAV.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} />
        ))}
      </nav>

      <div className="space-y-1 border-t border-[var(--border)] p-3">
        {BOTTOM_NAV.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} />
        ))}
        {!collapsed ? (
          <div className="mt-2 flex items-center gap-3 rounded-md px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-subtle)] text-xs font-medium text-[var(--primary)]">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{userName}</p>
              {userEmail ? (
                <p className="truncate text-xs text-[var(--subtle-foreground)]">{userEmail}</p>
              ) : null}
            </div>
          </div>
        ) : null}
        {onLogout ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={onLogout}
            data-testid="logout-button"
          >
            Sign out
          </Button>
        ) : null}
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation overlay"
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-all duration-200 md:z-30',
          collapsed ? 'w-[var(--sidebar-collapsed)]' : 'w-[var(--sidebar-width)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {sidebarContent}

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[72px] hidden h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--subtle-foreground)] shadow-sm hover:text-[var(--foreground)] md:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>
      </aside>

      <div
        className={cn(
          'flex min-h-screen flex-1 flex-col transition-all duration-200',
          'md:ml-[var(--sidebar-width)]',
          collapsed && 'md:ml-[var(--sidebar-collapsed)]',
        )}
      >
        <div className="sticky top-0 z-20 flex h-[var(--header-height)] items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 md:px-6">
          <button
            type="button"
            className="rounded-md p-2 hover:bg-[var(--surface-secondary)] md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          {header ?? <span className="text-sm font-medium text-[var(--muted-foreground)]">Genie</span>}
        </div>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function NavItem({
  item,
  active,
  collapsed,
}: {
  item: { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-[var(--primary-subtle)] text-[var(--primary)]'
          : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]',
        collapsed && 'justify-center px-2',
      )}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed ? <span>{item.label}</span> : null}
    </Link>
  );
}
