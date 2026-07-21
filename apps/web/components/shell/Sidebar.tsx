'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BotMessageSquare,
  MessagesSquare,
  BarChart3,
  Settings,
  LifeBuoy,
  CreditCard,
  Users,
  ChevronsUpDown,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/providers/auth-provider';
import { companyInitials } from '@/lib/identity';
import { GenieLogo } from '@/components/brand/GenieLogo';

const primary = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/assistants', label: 'Assistants', icon: BotMessageSquare },
  { href: '/dashboard/conversations', label: 'Conversations', icon: MessagesSquare },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
] as const;

const workspace = [
  { href: '/dashboard/team', label: 'Team', icon: Users },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
] as const;

function NavItem({
  href,
  label,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active =
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'group relative flex h-10 items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        active
          ? 'bg-primary-subtle text-primary'
          : 'text-sidebar-foreground hover:bg-surface-muted hover:text-foreground',
      )}
    >
      {active && (
        <span
          className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-primary"
          aria-hidden
        />
      )}
      <Icon
        className={cn(
          'h-4 w-4 shrink-0',
          active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
        )}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { user, activeOrg, organizations, setActiveOrgId, logout } = useAuth();
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pt-4 pb-3">
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2 px-1.5 py-1">
          <GenieLogo className="h-8 w-8 text-[#5A5CE6]" />
          <span className="text-[15px] font-semibold tracking-tight text-foreground font-heading">
            Genie
          </span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-testid="org-switcher"
              className="mt-3 flex w-full items-center gap-2 rounded-2xl border border-border bg-surface/80 px-2.5 py-2 text-left transition-colors hover:bg-surface-muted"
              aria-label="Switch company"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-xs font-semibold text-foreground">
                {companyInitials(activeOrg?.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-foreground">
                  {activeOrg?.name ?? 'Company'}
                </div>
                <div className="truncate text-[11px] text-muted-foreground capitalize">
                  {activeOrg?.role ?? 'member'}
                </div>
              </div>
              <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 rounded-2xl">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Your companies
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                data-testid={`org-switch-${org.id}`}
                onClick={() => {
                  setActiveOrgId(org.id);
                  onNavigate?.();
                }}
                className="flex items-center gap-2 rounded-xl"
              >
                <span className="min-w-0 flex-1 truncate text-sm">{org.name}</span>
                {org.id === activeOrg?.id ? <Check className="h-4 w-4 text-primary" /> : null}
              </DropdownMenuItem>
            ))}
            {organizations.length === 0 ? (
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                No companies
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/team" onClick={onNavigate} className="w-full rounded-xl">
                Manage team
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        <div className="space-y-1">
          {primary.map((item) => (
            <NavItem key={item.href} {...item} onNavigate={onNavigate} />
          ))}
        </div>
        <div>
          <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Workspace
          </div>
          <div className="space-y-1">
            {workspace.map((item) => (
              <NavItem key={item.href} {...item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-border px-3 py-3 space-y-1">
        <Link
          href="/dashboard/help"
          className="flex h-10 items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <LifeBuoy className="h-4 w-4 text-muted-foreground" />
          Help & docs
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-testid="user-menu-trigger"
              aria-label="Account menu"
              className="mt-1 flex w-full items-center gap-2 rounded-2xl p-2 text-left transition-colors hover:bg-surface-muted"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="rounded-xl bg-primary-subtle text-primary text-[11px] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-foreground">
                  {user?.name ?? 'Account'}
                </div>
                <div className="truncate text-[11px] text-muted-foreground">{user?.email}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl">
            <DropdownMenuLabel>{user?.name ?? 'Account'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/team" className="rounded-xl">
                Team
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="rounded-xl">
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/billing" className="rounded-xl">
                Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-testid="logout-button"
              className="rounded-xl"
              onClick={() => void logout()}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden md:flex fixed inset-y-2 left-2 z-30 w-[240px] flex-col overflow-hidden rounded-3xl border border-border bg-surface/50 shadow-lg shadow-primary/5 backdrop-blur-xl">
      <SidebarBody />
    </aside>
  );
}
