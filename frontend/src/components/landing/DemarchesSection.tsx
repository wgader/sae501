'use client';

import Link from 'next/link';

interface DemarcheCardData {
  id: string;
  tag: string;
  number: string;
  title: string;
  description: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  tagColor: string;
  descColor: string;
  buttonBg: string;
  buttonText: string;
  icon: React.ReactNode;
  href: string;
}

const demarches: DemarcheCardData[] = [
  {
    id: 'subvention',
    tag: 'SUBVENTIONS',
    number: '01',
    title: 'Gérer vos demandes de subvention',
    description: "Déposez vos dossiers, suivez l'avancement et retrouvez les échanges au même endroit.",
    bgColor: 'bg-[var(--Misty-Rose)]',
    borderColor: 'border-[var(--ink)]/10',
    textColor: 'text-[var(--ink)]',
    tagColor: 'text-[var(--ink)]/60',
    descColor: 'text-[var(--ink)]/80',
    buttonBg: 'bg-[var(--ink)]',
    buttonText: 'text-[var(--White)]',
    href: '/connexion',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    id: 'salle',
    tag: 'RÉSERVATIONS',
    number: '02',
    title: 'Réserver une salle municipale',
    description: "Consultez les disponibilités et réservez l'espace adapté à votre prochaine manifestation.",
    bgColor: 'bg-[var(--Lime-Cream)]',
    borderColor: 'border-[var(--ink)]/10',
    textColor: 'text-[var(--ink)]',
    tagColor: 'text-[var(--ink)]/60',
    descColor: 'text-[var(--ink)]/80',
    buttonBg: 'bg-[var(--ink)]',
    buttonText: 'text-[var(--White)]',
    href: '/connexion',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
        <path d="M15 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
      </svg>
    ),
  },
  {
    id: 'materiel',
    tag: 'LOGISTIQUE',
    number: '03',
    title: 'Faire une demande de matériel',
    description: "Exprimez vos besoins et organisez simplement la mise à disposition de matériel.",
    bgColor: 'bg-[var(--Indigo-Bloom)]',
    borderColor: 'border-white/20',
    textColor: 'text-[var(--White)]',
    tagColor: 'text-[var(--White)]/70',
    descColor: 'text-[var(--White)]/85',
    buttonBg: 'bg-[var(--ink)]',
    buttonText: 'text-[var(--White)]',
    href: '/connexion',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    id: 'evenement',
    tag: 'ÉVÉNEMENTS',
    number: '04',
    title: 'Déclarer un événement associatif',
    description: "Transmettez les informations utiles à la mairie pour la bonne tenue de vos événements.",
    bgColor: 'bg-[var(--Mint-Cream)]',
    borderColor: 'border-[var(--ink)]/10',
    textColor: 'text-[var(--ink)]',
    tagColor: 'text-[var(--ink)]/60',
    descColor: 'text-[var(--ink)]/80',
    buttonBg: 'bg-[var(--ink)]',
    buttonText: 'text-[var(--White)]',
    href: '/connexion',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

export default function DemarchesSection() {
  return (
    <section
      id="demarches"
      aria-labelledby="demarches-heading"
      className="scroll-mt-24 py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-[85rem] px-4 sm:px-8 lg:px-12">
        <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[var(--moss)]">
              — Tout au même endroit
            </p>
            <h2
              id="demarches-heading"
              className="mt-3 text-[clamp(1.875rem,3.75vw,2.75rem)] font-black leading-tight tracking-[-0.03em] text-[var(--ink)]"
            >
              Les démarches de votre association, simplement.
            </h2>
          </div>

          <p className="max-w-md text-[0.9375rem] leading-[1.6] text-[var(--muted)]">
            Plus besoin de chercher le bon formulaire ou de multiplier les
            échanges : votre espace vous guide et conserve l&apos;historique.
          </p>
        </header>

        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 p-0">
          {demarches.map((card) => (
            <li key={card.id} className="list-none">
              <article
                className={`group flex min-h-[22rem] h-full flex-col justify-between rounded-[24px] border ${card.borderColor} ${card.bgColor} p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[0.6875rem] font-bold uppercase tracking-[0.16em] ${card.tagColor}`}>
                      {card.tag}
                    </span>
                    <span className={`text-[0.6875rem] font-bold uppercase tracking-[0.16em] ${card.tagColor}`}>
                      {card.number}
                    </span>
                  </div>

                  <div className="mt-6 flex h-10 w-10 items-center justify-center rounded-xl bg-black/5">
                    <div className={card.textColor}>{card.icon}</div>
                  </div>

                  <h3 className={`mt-5 text-[1.25rem] font-black leading-[1.15] tracking-[-0.02em] ${card.textColor}`}>
                    {card.title}
                  </h3>

                  <p className={`mt-3 text-[0.875rem] leading-[1.5] ${card.descColor}`}>
                    {card.description}
                  </p>
                </div>

                <footer className="mt-6 flex items-center justify-between border-t border-current/15 pt-4">
                  <span className={`text-[0.6875rem] font-bold uppercase tracking-[0.16em] ${card.textColor}`}>
                    Disponible en ligne
                  </span>

                  <Link
                    href={card.href}
                    aria-label={`Accéder à : ${card.title}`}
                    className={`grid h-8 w-8 place-items-center rounded-full ${card.buttonBg} ${card.buttonText} transition-all duration-200 group-hover:scale-110 ${
                      card.id === 'materiel' ? 'group-hover:bg-[var(--White)] group-hover:text-[var(--Indigo-Bloom)]' : ''
                    }`}
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14" />
                      <path d="M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </footer>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
