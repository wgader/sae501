'use client';

import LandingHeader from './LandingHeader';
import HeroSection from './HeroSection';
import DemarchesSection from './DemarchesSection';
import ParcoursSection from './ParcoursSection';
import FaqSection from './FaqSection';
import CtaSection from './CtaSection';
import LandingFooter from './LandingFooter';

interface LandingPageProps {
  isConnected?: boolean;
  onLogout?: () => void;
}

export default function LandingPage({ isConnected = false, onLogout }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white font-sans text-ink antialiased selection:bg-accent selection:text-ink">
      {/* 1. Navbar */}
      <LandingHeader isConnected={isConnected} onLogout={onLogout} />

      {/* 2. Semantic Main Body */}
      <main id="main-content">
        {/* Hero Section */}
        <HeroSection />

        {/* Tout au même endroit (4 Demarches Cards) */}
        <DemarchesSection />

        {/* Un parcours clair (3 Steps Banner) */}
        <ParcoursSection />

        {/* Questions fréquentes (5 Accordions) */}
        <FaqSection />

        {/* Prêt à commencer ? (CTA Banner) */}
        <CtaSection />
      </main>

      {/* 3. Footer */}
      <LandingFooter />
    </div>
  );
}
