'use client';

import { motion } from 'motion/react';
import { IconArrowRight } from '@/components/ui/icons';
import AppPreview from './ui/AppPreview';
import BrandDot from './ui/BrandDot';
import LandingContainer from './ui/LandingContainer';
import LandingLink from './ui/LandingLink';

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export default function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="relative z-10 bg-paper pt-36 sm:pt-44">
      <LandingContainer className="text-center">
        <motion.h1
          id="hero-title"
          {...rise(0)}
          className="mx-auto max-w-4xl text-5xl font-black tracking-heading text-balance text-ink sm:text-7xl"
        >
          Les démarches de votre asso, au même endroit<BrandDot />
        </motion.h1>

        <motion.p {...rise(0.1)} className="mx-auto mt-6 max-w-xl text-body-lg leading-copy text-muted sm:text-lg">
          Subventions, salles, matériel et événements avec la mairie de Feytiat.
        </motion.p>

        <motion.div {...rise(0.2)} className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <LandingLink href="/inscription" className="rounded-pill">
            Créer le compte de mon asso
            <IconArrowRight className="size-4" />
          </LandingLink>
          <LandingLink href="/connexion" variant="secondary" className="rounded-pill">
            Se connecter
          </LandingLink>
        </motion.div>

        <motion.p {...rise(0.3)} className="mt-6 text-body-sm text-muted">
          Réservé aux associations de Feytiat.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto -mb-28 mt-16 max-w-5xl sm:-mb-36 sm:mt-20"
        >
          <AppPreview />
        </motion.div>
      </LandingContainer>
    </section>
  );
}
