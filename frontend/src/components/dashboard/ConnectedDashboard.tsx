'use client';

import { useSyncExternalStore } from 'react';
import { getStoredAssociationName } from '@/lib/authUtils';
import DashboardActionCard, { DashboardActionCardProps } from './DashboardActionCard';

function subscribeAuth(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('auth-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('auth-change', callback);
  };
}

function getServerNameSnapshot(): string {
  return 'Feytiat Loisirs';
}

const dashboardCards: DashboardActionCardProps[] = [
  {
    step: '01',
    tag: 'FINANCER',
    title: (
      <>
        Demande de<br />subvention
      </>
    ),
    description: "Déposez votre dossier et suivez l'avancement de votre demande.",
    bgClass: 'bg-rose-100',
    href: '/subventions',
  },
  {
    step: '02',
    tag: 'SE RÉUNIR',
    title: (
      <>
        Réserver<br />une salle
      </>
    ),
    description: 'Trouvez un espace municipal adapté à vos réunions et à vos événements.',
    bgClass: 'bg-accent',
    href: '/salles',
  },
  {
    step: '03',
    tag: "S'ÉQUIPER",
    title: (
      <>
        Demande de<br />matériel
      </>
    ),
    description: 'Réservez le matériel dont votre association a besoin pour ses projets.',
    bgClass: 'bg-indigo',
    isDark: true,
    href: '/materiel',
  },
  {
    step: '04',
    tag: 'ORGANISER',
    title: (
      <>
        Déclarer un<br />événement
      </>
    ),
    description: 'Informez la mairie de votre évènement et transmettez les documents utiles.',
    bgClass: 'bg-primary-soft',
    href: '/evenements',
  },
];

export default function ConnectedDashboard() {
  const rawName = useSyncExternalStore(
    subscribeAuth,
    getStoredAssociationName,
    getServerNameSnapshot
  );

  const associationName = rawName.replace(/^Association\s+/i, '').trim() || rawName;

  return (
    <main className="min-h-screen bg-white px-4 py-6 sm:px-8 lg:px-12 lg:py-8">
      <div className="mx-auto max-w-336">
        <section
          aria-labelledby="dashboard-welcome-heading"
          className="relative overflow-hidden rounded-card bg-sage px-6 py-8 transition-all duration-300 sm:px-10 sm:py-9"
        >
          <span
            className="pointer-events-none absolute -bottom-10 -right-10 h-44 w-44 rounded-full border-18 border-white/70"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-3xl">
            <p className="text-label font-bold uppercase tracking-eyebrow text-ink/80 sm:text-meta">
              Espace associations
            </p>

            <h1
              id="dashboard-welcome-heading"
              className="mt-3 text-[clamp(2.5rem,4.4vw,3.625rem)] font-black leading-[1.04] tracking-display text-ink"
            >
              Bonjour,<br />
              <span className="text-primary">{associationName}</span>
            </h1>

            <p className="mt-4 max-w-xl text-body leading-copy text-ink/80 sm:text-body-lg">
              Retrouvez toutes vos démarches municipales dans un espace simple,
              pensé pour vous faire gagner du temps.
            </p>
          </div>
        </section>

        <section aria-labelledby="commencer-heading" className="mt-8 pb-8">
          <header>
            <p className="text-label font-bold uppercase tracking-eyebrow text-ink/80 sm:text-meta">
              Commencer ici
            </p>
            <h2
              id="commencer-heading"
              className="mt-1 text-[clamp(1.5rem,2.5vw,2rem)] font-black tracking-display text-ink"
            >
              Que souhaitez-vous faire ?
            </h2>
          </header>

          <nav
            aria-label="Démarches disponibles"
            className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {dashboardCards.map((card) => (
              <DashboardActionCard
                key={card.step}
                step={card.step}
                tag={card.tag}
                title={card.title}
                description={card.description}
                bgClass={card.bgClass}
                isDark={card.isDark}
                href={card.href}
              />
            ))}
          </nav>
        </section>
      </div>
    </main>
  );
}
