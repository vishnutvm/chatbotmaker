import { Features } from '@/features/marketing/features';
import { Hero } from '@/features/marketing/hero';
import { FAQ } from '@/features/marketing/faq';
import { HowItWorks } from '@/features/marketing/how-it-works';
import { Pricing } from '@/features/marketing/pricing';
import { ContactSection } from '@/features/marketing/contact-section';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <ContactSection />
    </main>
  );
}
