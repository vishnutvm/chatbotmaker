'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SidebarBody } from '@/components/shell/Sidebar';
import { ThemeToggleButton } from '@/components/shell/ThemeToggleButton';

export function MobileTopBar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/90 px-3 backdrop-blur">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open menu" className="h-9 w-9">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-foreground">Genie</span>
      </Link>
      <ThemeToggleButton />
    </div>
  );
}
