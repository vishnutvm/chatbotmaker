'use client';

import type { ReactNode } from 'react';

/** ThemeProvider lives in root `Providers` so marketing + dashboard share one theme. */
export function MarketingProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
