'use client';

import { ThemeProvider } from '@/features/marketing/theme-provider';

export function MarketingProviders({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultTheme="light">{children}</ThemeProvider>;
}
