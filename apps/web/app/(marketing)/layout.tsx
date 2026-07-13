import { SiteHeader } from '@/features/marketing/site-header';
import { Footer } from '@/features/marketing/footer';
import { MarketingProviders } from './marketing-providers';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingProviders>
      <SiteHeader />
      {children}
      <Footer />
    </MarketingProviders>
  );
}
