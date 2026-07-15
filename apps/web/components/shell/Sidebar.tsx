'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bot,
  MessagesSquare,
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

/** MVP: Assistants is the home surface at `/dashboard` (metrics Home + Analytics deferred). */
const primary = [
  { href: '/dashboard', label: 'Assistants', icon: Bot },
  { href: '/dashboard/conversations', label: 'Conversations', icon: MessagesSquare },
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
  // Assistants home is `/dashboard`; also highlight for `/dashboard/assistants/*` workspace routes.
  const active =
    href === '/dashboard'
      ? pathname === '/dashboard' || pathname.startsWith('/dashboard/assistants')
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'group relative flex h-9.5 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-all duration-200 active:scale-98',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        active
          ? 'bg-primary/8 text-primary shadow-xs border border-primary/10'
          : 'text-sidebar-foreground/80 hover:bg-muted/50 hover:text-foreground border border-transparent',
      )}
    >
      {active && (
        <span
          className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-primary animate-in fade-in slide-in-from-left-1 duration-200"
          aria-hidden
        />
      )}
      <Icon
        className={cn(
          'h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-105',
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
    <div className="flex h-full flex-col bg-sidebar/40 backdrop-blur-md">
      {/* Brand + Org Selector */}
      <div className="px-4 pt-5 pb-3">
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2 px-1 py-0.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-hover text-primary-foreground shadow-md shadow-primary/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-[16px] font-bold tracking-tight text-foreground bg-clip-text">
            Genie
          </span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-testid="org-switcher"
              className="mt-4 flex w-full items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-left transition-all hover:bg-muted/50 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              aria-label="Switch company"
            >
              <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/25 text-xs font-semibold text-primary shadow-xs">
                {companyInitials(activeOrg?.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-foreground leading-tight">
                  {activeOrg?.name ?? 'Company'}
                </div>
                <div className="truncate text-[10px] text-muted-foreground capitalize font-medium">
                  {activeOrg?.role ?? 'member'}
                </div>
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground/80" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 shadow-lg border border-border/80">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-3 py-2">Your companies</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/60" />
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                data-testid={`org-switch-${org.id}`}
                onClick={() => {
                  setActiveOrgId(org.id);
                  onNavigate?.();
                }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-muted"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{org.name}</span>
                {org.id === activeOrg?.id ? <Check className="h-4 w-4 text-primary" /> : null}
              </DropdownMenuItem>
            ))}
            {organizations.length === 0 ? (
              <DropdownMenuItem disabled className="text-xs text-muted-foreground px-3 py-2">No companies</DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator className="bg-border/60" />
            <DropdownMenuItem asChild className="px-3 py-2">
              <Link href="/dashboard/team" onClick={onNavigate} className="w-full text-sm font-medium">
                Manage team
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 py-3 space-y-7">
        <div className="space-y-1">
          {primary.map((item) => (
            <NavItem key={item.href} {...item} onNavigate={onNavigate} />
          ))}
        </div>
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Account
          </div>
          <div className="space-y-1">
            {account.map((item) => (
              <NavItem key={item.href} {...item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </nav>

      {/* Footer / User Profile */}
      <div className="border-t border-border px-4 py-4 space-y-1 bg-surface-muted/30">
        <Link
          href="/dashboard/help"
          className="flex h-9.5 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/80 transition-all hover:bg-muted/50 hover:text-foreground border border-transparent"
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
              className="mt-1.5 flex w-full items-center gap-2.5 rounded-lg border border-transparent p-1.5 text-left transition-all hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <Avatar className="h-8 w-8 border border-border shadow-xs">
                <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary text-[11px] font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-foreground leading-tight">
                  {user?.name ?? 'Account'}
                </div>
                <div className="truncate text-[10px] text-muted-foreground font-medium">{user?.email}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 shadow-lg border border-border/80">
            <DropdownMenuLabel className="font-semibold">{user?.name ?? 'Account'}</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/60" />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/team">Team</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/billing">Billing</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/60" />
            <DropdownMenuItem data-testid="logout-button" onClick={() => void logout()} className="text-destructive focus:bg-destructive/10">
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
    <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-[248px] flex-col border-r border-border bg-sidebar/80 backdrop-blur-md">
      <SidebarBody />
    </aside>
  );
}
