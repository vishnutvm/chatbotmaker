import { Features } from "@/components/features";
import { Hero } from "@/components/hero";
import { FAQ } from "@/components/faq";
import { Footer } from "@/components/footer";
import { HowItWorks } from "@/components/how-it-works";
import { Pricing } from "@/components/pricing";
import { SocialProof } from "@/components/social-proof";

import { ContactSection } from "@/components/contact-section";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      {/* <SocialProof /> */}
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <ContactSection />
      <Footer />
    </main>
  );
}
