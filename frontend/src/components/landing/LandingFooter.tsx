import Link from 'next/link';
import BrandMark from './ui/BrandMark';
import LandingContainer from './ui/LandingContainer';
import { CITY_WEBSITE_URL, LANDING_SECTIONS } from './landingContent';

const FOOTER_COLUMNS: ReadonlyArray<{ title: string; links: ReadonlyArray<{ href: string; label: string; external?: boolean }> }> = [
  {
    title: 'Espace associations',
    links: [
      { href: '/inscription', label: 'Inscrire mon association' },
      { href: '/connexion', label: 'Se connecter' },
      { href: `/#${LANDING_SECTIONS.services}`, label: 'Les démarches' },
    ],
  },
  {
    title: 'Aide',
    links: [
      { href: `/#${LANDING_SECTIONS.faq}`, label: 'Questions fréquentes' },
      { href: '/contact', label: 'Contacter la mairie' },
    ],
  },
  {
    title: 'Mairie de Feytiat',
    links: [
      { href: CITY_WEBSITE_URL, label: 'Site de la ville', external: true },
      { href: '/admin', label: 'Accès agents municipaux' },
    ],
  },
];

export default function LandingFooter() {
  return (
    <footer className="bg-ink text-white">
      <LandingContainer className="grid gap-12 py-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <BrandMark tone="dark" />
          <p className="mt-6 max-w-sm text-body-sm leading-copy text-white/60">
            Le service en ligne de la ville de Feytiat pour accompagner les associations dans leurs démarches.
          </p>
        </div>

        <nav aria-label="Pied de page" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-label font-bold uppercase tracking-eyebrow text-accent">{column.title}</p>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a href={link.href} target="_blank" rel="noreferrer" className="text-body-sm text-white/75 transition-colors hover:text-white">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-body-sm text-white/75 transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </LandingContainer>
      <div className="border-t border-white/10">
        <LandingContainer className="py-6 text-meta text-white/50">© Ville de Feytiat · Espace associations</LandingContainer>
      </div>
    </footer>
  );
}
