'use client';

import { useState } from 'react';
import { IconClose } from '@/components/ui/icons';
import BrandMark from './ui/BrandMark';
import LandingContainer from './ui/LandingContainer';
import LandingLink from './ui/LandingLink';
import { LANDING_NAV_LINKS } from './landingContent';

interface LandingHeaderProps {
  isConnected?: boolean;
  onLogout?: () => void;
}

export default function LandingHeader({ isConnected = false, onLogout }: LandingHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-paper/90 backdrop-blur-md">
      <LandingContainer className="flex h-18 items-center justify-between gap-6">
        <BrandMark />

        <nav aria-label="Sections de la page" className="hidden items-center gap-8 lg:flex">
          {LANDING_NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-body-sm font-bold text-ink/80 transition-colors hover:text-primary">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          {isConnected ? (
            <>
              <button type="button" onClick={onLogout} className="px-3 text-meta font-bold uppercase tracking-label text-muted transition-colors hover:text-danger">
                Déconnexion
              </button>
              <LandingLink href="/" size="md">Mon espace</LandingLink>
            </>
          ) : (
            <>
              <LandingLink href="/connexion" variant="ghost" size="md">Se connecter</LandingLink>
              <LandingLink href="/inscription" size="md">Inscrire mon association</LandingLink>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-menu"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          className="flex size-11 items-center justify-center rounded-control border border-line bg-white text-ink lg:hidden"
        >
          {menuOpen ? (
            <IconClose className="size-5" />
          ) : (
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h10" />
            </svg>
          )}
        </button>
      </LandingContainer>

      {menuOpen && (
        <div id="landing-mobile-menu" className="border-t border-line bg-paper lg:hidden">
          <LandingContainer className="py-6">
            <nav aria-label="Menu mobile" className="flex flex-col">
              {LANDING_NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} onClick={closeMenu} className="border-b border-line py-4 text-body-lg font-bold text-ink">
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-6 flex flex-col gap-3 sm:hidden">
              {isConnected ? (
                <>
                  <LandingLink href="/" onClick={closeMenu}>Mon espace</LandingLink>
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      onLogout?.();
                    }}
                    className="py-3 text-meta font-bold uppercase tracking-label text-danger"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <LandingLink href="/inscription" onClick={closeMenu}>Inscrire mon association</LandingLink>
                  <LandingLink href="/connexion" variant="secondary" onClick={closeMenu}>Se connecter</LandingLink>
                </>
              )}
            </div>
          </LandingContainer>
        </div>
      )}
    </header>
  );
}
