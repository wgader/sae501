import Image from 'next/image';
import Link from 'next/link';
import LandingContainer from './ui/LandingContainer';
import { CITY_WEBSITE_URL, LANDING_ANCHORS } from './landingContent';

const LINKS: ReadonlyArray<{ href: string; label: string; external?: boolean }> = [
  { href: `/#${LANDING_ANCHORS.modules}`, label: 'Modules' },
  { href: `/#${LANDING_ANCHORS.faq}`, label: 'Questions' },
  { href: '/contact', label: 'Contact' },
  { href: '/admin', label: 'Espace agents' },
  { href: CITY_WEBSITE_URL, label: 'ville-feytiat.fr', external: true },
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <LandingContainer className="flex flex-col gap-8 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Image src="/assets/logo-feytiat.svg" alt="Ville de Feytiat" width={160} height={33} className="h-7 w-auto" />
          <span className="text-body-sm text-muted">Espace associations</span>
        </div>
        <nav aria-label="Pied de page">
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {LINKS.map((link) => (
              <li key={link.href}>
                {link.external ? (
                  <a href={link.href} target="_blank" rel="noreferrer" className="text-body-sm font-bold text-muted transition-colors hover:text-ink">
                    {link.label}
                  </a>
                ) : (
                  <Link href={link.href} className="text-body-sm font-bold text-muted transition-colors hover:text-ink">
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </LandingContainer>
    </footer>
  );
}
