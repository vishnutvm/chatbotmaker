'use client';

import { AppSidebar } from '@/components/shell/Sidebar';
import { MobileTopBar } from '@/components/shell/MobileTopBar';
import { DashboardAuthGate } from '@/components/auth/dashboard-auth-gate';

export default function DashboardShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardAuthGate>
      <div className="min-h-dvh bg-background">
        <AppSidebar />
        <div className="md:pl-[248px]">
          <MobileTopBar />
          <main className="animate-in fade-in duration-300">{children}</main>
        </div>
      </div>
    </DashboardAuthGate>
  );
}
