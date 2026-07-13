'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSession } from '@/lib/supabase';

export function DashboardAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    void (async () => {
      const session = await getSession();
      if (!session) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    })();
  }, [pathname, router]);

  return <>{children}</>;
}
