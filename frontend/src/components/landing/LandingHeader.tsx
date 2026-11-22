'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { IconClose } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import LandingLink from './ui/LandingLink';
import { LANDING_NAV } from './landingContent';

interface LandingHeaderProps {
  isConnected?: boolean;
  onLogout?: () => void;
}

/** Barre de navigation flottante, qui se pose sur un fond blanc dès que la page défile. */
export default function LandingHeader({ isConnected = false, onLogout }: LandingHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <div
        className={cn(
          'mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 rounded-pill border pr-2 pl-5 transition-all duration-300 sm:pl-6',
          scrolled || menuOpen ? 'border-line/80 bg-white/90 shadow-card backdrop-blur-xl' : 'border-transparent bg-transparent',
        )}
      >
        <Link href="/" aria-label="Accueil de l’espace associations de Feytiat" className="shrink-0 transition-opacity hover:opacity-80">
          <Image src="/assets/logo-feytiat.svg" alt="" width={160} height={33} priority className="h-7 w-auto" />
        </Link>

        <nav aria-label="Sections de la page" className="hidden items-center gap-1 md:flex">
          {LANDING_NAV.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-pill px-4 py-2 text-body-sm font-bold text-ink/70 transition-colors hover:bg-paper hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-1 sm:flex">
          {isConnected ? (
            <>
              <button type="button" onClick={onLogout} className="rounded-pill px-4 py-2 text-body-sm font-bold text-muted transition-colors hover:text-danger">
                Déconnexion
              </button>
              <LandingLink href="/" size="sm" className="h-11 rounded-pill px-5">Mon espace</LandingLink>
            </>
          ) : (
            <>
              <Link href="/connexion" className="rounded-pill px-4 py-2 text-body-sm font-bold text-ink transition-colors hover:bg-paper">
                Connexion
              </Link>
              <LandingLink href="/inscription" size="sm" className="h-11 rounded-pill px-5">Créer un compte</LandingLink>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-menu"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          className="flex size-11 items-center justify-center rounded-pill text-ink transition-colors hover:bg-paper sm:hidden"
        >
          {menuOpen ? (
            <IconClose className="size-5" />
          ) : (
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
              <path d="M4 8h16M4 16h10" />
            </svg>
          )}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="landing-mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mx-auto mt-2 max-w-6xl rounded-card border border-line bg-white p-3 shadow-panel sm:hidden"
          >
            <nav aria-label="Menu mobile" className="flex flex-col">
              {LANDING_NAV.map((link) => (
                <a key={link.href} href={link.href} onClick={closeMenu} className="rounded-soft px-4 py-3.5 text-body-lg font-bold text-ink hover:bg-paper">
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-2 grid gap-2 border-t border-line pt-3">
              {isConnected ? (
                <>
                  <LandingLink href="/" onClick={closeMenu} className="rounded-pill">Mon espace</LandingLink>
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      onLogout?.();
                    }}
                    className="py-3 text-body-sm font-bold text-danger"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <LandingLink href="/inscription" onClick={closeMenu} className="rounded-pill">Créer un compte</LandingLink>
                  <LandingLink href="/connexion" variant="secondary" onClick={closeMenu} className="rounded-pill">Connexion</LandingLink>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
