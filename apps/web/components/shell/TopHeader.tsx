import { Search, Bell, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';
import { ThemeToggleButton } from '@/components/shell/ThemeToggleButton';

export function TopHeader({ breadcrumb }: { breadcrumb?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 mx-3 mt-2 flex h-14 items-center gap-4 rounded-2xl border border-border bg-surface/80 px-5 backdrop-blur-xl md:mx-4">
      <div className="min-w-0 flex-1 text-sm text-muted-foreground">{breadcrumb}</div>
      <div className="hidden lg:block">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assistants, conversations…"
            className="h-9 w-[320px] rounded-xl border-transparent bg-surface-muted pl-8 focus-visible:border-border focus-visible:bg-surface"
          />
        </div>
      </div>
      <ThemeToggleButton />
      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" aria-label="Help">
        <HelpCircle className="h-4 w-4 text-muted-foreground" />
      </Button>
      <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl" aria-label="Notifications">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
      </Button>
    </header>
  );
}
