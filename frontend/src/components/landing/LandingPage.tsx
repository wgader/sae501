'use client';

import { MotionConfig } from 'motion/react';
import CtaSection from './CtaSection';
import FaqSection from './FaqSection';
import HeroSection from './HeroSection';
import LandingFooter from './LandingFooter';
import LandingHeader from './LandingHeader';
import ModulesSection from './ModulesSection';
import StepsSection from './StepsSection';

interface LandingPageProps {
  isConnected?: boolean;
  onLogout?: () => void;
}

/** Page d'accueil publique. Les animations respectent la préférence « réduire les animations ». */
export default function LandingPage({ isConnected = false, onLogout }: LandingPageProps) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen w-full bg-white text-ink antialiased selection:bg-accent selection:text-ink">
        <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-60 focus:rounded-control focus:bg-ink focus:px-4 focus:py-3 focus:text-white">
          Aller au contenu
        </a>
        <LandingHeader isConnected={isConnected} onLogout={onLogout} />
        <main id="contenu">
          <HeroSection />
          <ModulesSection />
          <StepsSection />
          <FaqSection />
          <CtaSection />
        </main>
        <LandingFooter />
      </div>
    </MotionConfig>
  );
}
