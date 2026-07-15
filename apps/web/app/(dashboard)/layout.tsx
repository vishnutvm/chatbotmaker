'use client';

import { AppSidebar } from '@/components/shell/Sidebar';
import { MobileTopBar } from '@/components/shell/MobileTopBar';
import { DashboardAuthGate } from '@/components/auth/dashboard-auth-gate';

export default function DashboardShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardAuthGate>
      <div className="relative min-h-dvh bg-background text-foreground">
        {/* Ambient glow */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/3 h-[520px] w-[520px] rounded-full bg-primary/20 blur-[140px]" />
          <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[120px]" />
        </div>
        <AppSidebar />
        <div className="md:pl-[252px]">
          <MobileTopBar />
          <main className="animate-in fade-in duration-500">{children}</main>
        </div>
      </div>
    </DashboardAuthGate>
  );
}
