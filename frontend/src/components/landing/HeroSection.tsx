import type { ReactNode } from 'react';
import Image from 'next/image';
import { IconArrowRight, IconCheck, IconSalle, IconSubvention } from '@/components/ui/icons';
import LandingContainer from './ui/LandingContainer';
import LandingLink from './ui/LandingLink';
import { CITY_WEBSITE_URL } from './landingContent';

/** Ouverture de la page : à qui s'adresse l'espace et comment y entrer. */
export default function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-paper">
      <LandingContainer className="grid items-center gap-12 pt-10 pb-16 sm:pt-14 lg:grid-cols-12 lg:gap-10 lg:pt-20 lg:pb-24">
        <div className="lg:col-span-7">
          <p className="inline-flex items-center gap-2 rounded-pill border border-primary/20 bg-white px-3.5 py-1.5 text-label font-bold uppercase tracking-label text-primary">
            <span className="size-1.5 rounded-pill bg-primary" aria-hidden="true" />
            <span className="sm:hidden">Réservé aux associations</span>
            <span className="hidden sm:inline">Ville de Feytiat · Espace réservé aux associations</span>
          </p>

          <h1
            id="hero-title"
            className="mt-7 font-display text-5xl leading-display font-normal tracking-display text-balance text-ink sm:text-6xl xl:text-7xl"
          >
            Le guichet en ligne des <em className="text-primary">associations</em> de Feytiat.
          </h1>

          <p className="mt-7 max-w-xl text-body-lg leading-copy text-pretty text-muted sm:text-lg">
            Subventions, salles, matériel, événements : votre association fait ses démarches auprès de la mairie depuis
            un seul compte, et suit chaque réponse sans se déplacer.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <LandingLink href="/inscription" className="w-full sm:w-auto">
              Inscrire mon association
              <IconArrowRight className="size-4" />
            </LandingLink>
            <LandingLink href="/connexion" variant="secondary" className="w-full sm:w-auto">
              J’ai déjà un compte
            </LandingLink>
          </div>

          <p className="mt-8 max-w-xl border-t border-line pt-5 text-body-sm leading-copy text-muted">
            <strong className="font-bold text-ink">Vous êtes un particulier ?</strong> Cet espace est réservé aux
            associations. Vos démarches personnelles se font sur{' '}
            <a
              href={CITY_WEBSITE_URL}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary"
            >
              le site de la ville
            </a>
            .
          </p>
        </div>

        <div className="relative lg:col-span-5">
          <div className="relative aspect-4/5 overflow-hidden rounded-panel bg-sage shadow-panel">
            <Image
              src="/landing/salle-associative.jpg"
              alt="Salle municipale lumineuse, tables en bois et chaises installées pour une soirée associative."
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>

          <HeroStatusCard
            className="-bottom-6 left-4 sm:-left-8"
            tone="bg-module-grants"
            icon={<IconSubvention className="size-5" />}
            label="Subvention · Festival d’été"
            status="Accordée"
          />
          <HeroStatusCard
            className="top-6 -right-2 hidden sm:flex lg:-right-6"
            tone="bg-module-rooms"
            icon={<IconSalle className="size-5" />}
            label="Salle des fêtes · samedi 14 juin"
            status="Réservée"
          />
        </div>
      </LandingContainer>
    </section>
  );
}

interface HeroStatusCardProps {
  className: string;
  tone: string;
  icon: ReactNode;
  label: string;
  status: string;
}

/** Aperçu décoratif d'une démarche suivie dans l'espace. */
function HeroStatusCard({ className, tone, icon, label, status }: HeroStatusCardProps) {
  return (
    <div
      aria-hidden="true"
      className={`absolute flex items-center gap-3 rounded-card border border-white/60 bg-white/95 py-3 pr-4 pl-3 shadow-panel backdrop-blur ${className}`}
    >
      <span className={`flex size-10 items-center justify-center rounded-soft text-ink ${tone}`}>{icon}</span>
      <span>
        <span className="block text-meta font-bold text-ink">{label}</span>
        <span className="mt-0.5 inline-flex items-center gap-1 text-caption font-bold uppercase tracking-label text-primary">
          <IconCheck className="size-3" />
          {status}
        </span>
      </span>
    </div>
  );
}
