'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Bot,
  MessagesSquare,
  BarChart3,
  Settings,
  LifeBuoy,
  Sparkles,
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

const primary = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/assistants', label: 'Assistants', icon: Bot },
  { href: '/dashboard/conversations', label: 'Conversations', icon: MessagesSquare },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/team', label: 'Team', icon: Users },
] as const;

const account = [
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
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'group relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        active
          ? 'bg-primary-subtle text-primary'
          : 'text-sidebar-foreground hover:bg-surface-muted hover:text-foreground',
      )}
    >
      {active && (
        <span
          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-primary"
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
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">Genie</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-testid="org-switcher"
              className="mt-3 flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Switch company"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-subtle text-xs font-semibold text-primary">
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
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Your companies</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                data-testid={`org-switch-${org.id}`}
                onClick={() => {
                  setActiveOrgId(org.id);
                  onNavigate?.();
                }}
                className="flex items-center gap-2"
              >
                <span className="min-w-0 flex-1 truncate">{org.name}</span>
                {org.id === activeOrg?.id ? <Check className="h-4 w-4 text-primary" /> : null}
              </DropdownMenuItem>
            ))}
            {organizations.length === 0 ? (
              <DropdownMenuItem disabled>No companies</DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/team" onClick={onNavigate}>
                Manage team
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        <div className="space-y-0.5">
          {primary.map((item) => (
            <NavItem key={item.href} {...item} onNavigate={onNavigate} />
          ))}
        </div>
        <div>
          <div className="px-2.5 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Account
          </div>
          <div className="space-y-0.5">
            {account.map((item) => (
              <NavItem key={item.href} {...item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-border px-3 py-3 space-y-0.5">
        <Link
          href="/dashboard/help"
          className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
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
              className="mt-1 flex w-full items-center gap-2 rounded-md p-1.5 text-left transition-colors hover:bg-surface-muted"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary-subtle text-primary text-[11px] font-semibold">
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
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{user?.name ?? 'Account'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/team">Team</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/billing">Billing</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-testid="logout-button" onClick={() => void logout()}>
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
    <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-[248px] flex-col border-r border-border bg-sidebar">
      <SidebarBody />
    </aside>
  );
}
