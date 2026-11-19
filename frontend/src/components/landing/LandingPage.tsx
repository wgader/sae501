'use client';

import AudienceSection from './AudienceSection';
import CommunityBand from './CommunityBand';
import CtaSection from './CtaSection';
import FaqSection from './FaqSection';
import HeroSection from './HeroSection';
import LandingFooter from './LandingFooter';
import LandingHeader from './LandingHeader';
import ProcessSection from './ProcessSection';
import ServicesSection from './ServicesSection';
import { displayFont } from './fonts';

interface LandingPageProps {
  isConnected?: boolean;
  onLogout?: () => void;
}

/** Page d'accueil publique de l'espace associations. */
export default function LandingPage({ isConnected = false, onLogout }: LandingPageProps) {
  return (
    <div className={`${displayFont.variable} min-h-screen w-full bg-white font-sans text-ink antialiased selection:bg-accent selection:text-ink`}>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-60 focus:rounded-control focus:bg-ink focus:px-4 focus:py-3 focus:text-white">
        Aller au contenu
      </a>
      <LandingHeader isConnected={isConnected} onLogout={onLogout} />
      <main id="contenu">
        <HeroSection />
        <ServicesSection />
        <ProcessSection />
        <AudienceSection />
        <CommunityBand />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
