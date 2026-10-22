'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function LandingFooter() {
  return (
    <footer className="w-full bg-primary text-white">
      <div className="mx-auto max-w-340 px-4 pt-14 pb-10 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Link
              href="/"
              className="inline-flex items-center transition-opacity hover:opacity-90"
              aria-label="Accueil Feytiat"
            >
              <Image
                src="/assets/logo-feytiat-white.svg"
                alt="Ville de Feytiat"
                width={160}
                height={33}
                className="h-8 w-auto object-contain"
              />
            </Link>

            <p className="mt-4 max-w-[20rem] text-body-sm leading-[1.65] text-white/70">
              L&apos;espace numérique qui accompagne les associations de Feytiat
              dans leurs démarches municipales.
            </p>
          </div>

          <nav aria-label="Liens du pied de page" className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            <div>
              <p className="text-label font-bold uppercase tracking-kicker text-white/60">
                Démarches
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                <li>
                  <a
                    href="#demarches"
                    className="text-body-sm text-white/80 transition-colors hover:text-white"
                  >
                    Les démarches
                  </a>
                </li>
                <li>
                  <a
                    href="#comment-ca-marche"
                    className="text-body-sm text-white/80 transition-colors hover:text-white"
                  >
                    Comment ça marche
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="text-body-sm text-white/80 transition-colors hover:text-white"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-label font-bold uppercase tracking-kicker text-white/60">
                Mon Espace
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                <li>
                  <Link
                    href="/inscription"
                    className="text-body-sm text-white/80 transition-colors hover:text-white"
                  >
                    Créer un compte
                  </Link>
                </li>
                <li>
                  <Link
                    href="/connexion"
                    className="text-body-sm text-white/80 transition-colors hover:text-white"
                  >
                    Se connecter
                  </Link>
                </li>
                <li>
                  <Link
                    href="/deconnexion"
                    className="text-body-sm text-white/80 transition-colors hover:text-white"
                  >
                    Déconnexion
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className="text-label font-bold uppercase tracking-kicker text-white/60">
                Contact
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                <li>
                  <a
                    href="mailto:contact@ville-feytiat.fr"
                    className="text-body-sm text-white/80 transition-colors hover:text-white"
                  >
                    Nous contacter
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.ville-feytiat.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-body-sm text-white/80 transition-colors hover:text-white"
                  >
                    Informations pratiques
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.ville-feytiat.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-body-sm text-white/80 transition-colors hover:text-white"
                  >
                    Site de la ville
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-meta text-white/50 sm:flex-row">
          <p>© Feytiat - Espace associations</p>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/mentions-legales" className="transition-colors hover:text-white">
              MENTIONS LÉGALES
            </Link>
            <Link href="/confidentialite" className="transition-colors hover:text-white">
              CONFIDENTIALITÉ
            </Link>
            <Link href="/accessibilite" className="transition-colors hover:text-white">
              ACCESSIBILITÉ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
