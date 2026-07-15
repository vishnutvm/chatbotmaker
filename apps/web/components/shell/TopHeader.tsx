import { Search, Bell, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import { ThemeToggleButton } from "@/components/shell/ThemeToggleButton";

export function TopHeader({ breadcrumb }: { breadcrumb?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border/60 bg-surface/80 px-6 backdrop-blur-md">
      <div className="min-w-0 flex-1 text-sm font-medium text-muted-foreground flex items-center gap-1.5">{breadcrumb}</div>
      <div className="hidden lg:block">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Search assistants, conversations…"
            className="h-8.5 w-[280px] pl-8 bg-muted/50 border-border/60 focus-visible:bg-surface focus-visible:ring-primary/10 transition-all text-xs rounded-lg placeholder:text-muted-foreground/60"
          />
        </div>
      </div>
      <ThemeToggleButton />
      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground/80 hover:text-foreground" aria-label="Help">
        <HelpCircle className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-9 w-9 relative text-muted-foreground/80 hover:text-foreground" aria-label="Notifications">
        <Bell className="h-4 w-4" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
      </Button>
    </header>
  );
}
