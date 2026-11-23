'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LandingHeaderProps {
  isConnected?: boolean;
  onLogout?: () => void;
}

export default function LandingHeader({ isConnected = false, onLogout }: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-19 max-w-340 items-center justify-between px-4 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="flex items-center transition-opacity hover:opacity-90"
          aria-label="Accueil Feytiat - Espace associations"
        >
          <div className="w-36 sm:w-40">
            <Image
              src="/assets/logo-feytiat.svg"
              alt="Logo Ville de Feytiat"
              width={160}
              height={33}
              priority
              className="h-auto w-full object-contain"
            />
          </div>
        </Link>

        <nav
          aria-label="Navigation principale de la page"
          className="hidden items-center gap-8 md:flex lg:gap-10"
        >
          <a
            href="#demarches"
            className="text-sm font-bold uppercase tracking-label text-ink transition-colors hover:text-primary"
          >
            Les démarches
          </a>
          <a
            href="#comment-ca-marche"
            className="text-sm font-bold uppercase tracking-label text-ink transition-colors hover:text-primary"
          >
            Comment ça marche
          </a>
          <a
            href="#faq"
            className="text-sm font-bold uppercase tracking-label text-ink transition-colors hover:text-primary"
          >
            FAQ
          </a>
        </nav>

        <nav aria-label="Authentification" className="hidden items-center gap-4 sm:flex lg:gap-6">
          {isConnected ? (
            <>
              <Link
                href="/"
                className="inline-flex h-10.5 items-center justify-center rounded-control bg-primary px-5 text-xs font-bold uppercase tracking-label text-white shadow-xs transition-colors hover:bg-primary-hover"
              >
                Mon espace
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="text-xs font-bold uppercase tracking-label text-muted underline underline-offset-4 transition-colors hover:text-danger"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                href="/connexion"
                className="flex h-10.5 items-center text-xs font-bold uppercase tracking-label text-ink transition-colors hover:text-primary"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="inline-flex h-10.5 items-center justify-center rounded-control bg-primary px-5 text-xs font-bold uppercase tracking-label text-white shadow-xs transition-colors hover:bg-primary-hover"
              >
                Inscription
              </Link>
            </>
          )}
        </nav>

        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-label="Ouvrir le menu de navigation"
            className="flex size-10 items-center justify-center rounded-lg border border-line text-ink transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-primary"
          >
            <div className="relative h-4 w-5">
              <span
                className={`absolute left-0 block h-0.5 w-full transform rounded-full bg-ink transition-all duration-300 ${
                  mobileMenuOpen ? 'top-1.5 rotate-45' : 'top-0'
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 block h-0.5 w-full rounded-full bg-ink transition-opacity duration-300 ${
                  mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-full transform rounded-full bg-ink transition-all duration-300 ${
                  mobileMenuOpen ? 'top-1.5 -rotate-45' : 'top-3'
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden border-b border-line bg-white transition-all duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'max-h-96 opacity-100 py-6' : 'max-h-0 opacity-0 py-0'
        }`}
      >
        <nav aria-label="Navigation mobile" className="flex flex-col gap-4 px-6">
          <a
            href="#demarches"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-bold uppercase tracking-label text-ink hover:text-primary"
          >
            Les démarches
          </a>
          <a
            href="#comment-ca-marche"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-bold uppercase tracking-label text-ink hover:text-primary"
          >
            Comment ça marche
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-bold uppercase tracking-label text-ink hover:text-primary"
          >
            FAQ
          </a>

          <div className="mt-2 flex flex-col gap-3 border-t border-line pt-4">
            {isConnected ? (
              <>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 items-center justify-center rounded-control bg-primary text-center text-xs font-bold uppercase tracking-label text-white"
                >
                  Mon espace
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout?.();
                  }}
                  className="text-center text-xs font-bold uppercase tracking-label text-danger"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/connexion"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 items-center justify-center rounded-control border border-line text-center text-xs font-bold uppercase tracking-label text-ink"
                >
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 items-center justify-center rounded-control bg-primary text-center text-xs font-bold uppercase tracking-label text-white transition-colors hover:bg-primary-hover"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
