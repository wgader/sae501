'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { cva } from 'class-variance-authority';
import { IconAccueil, IconEvenement, IconHistorique, IconMateriel, IconSalle, IconSubvention } from '@/components/ui/icons';

const tileVariants = cva('flex flex-col justify-between rounded-soft p-3 sm:p-4', {
  variants: {
    tone: {
      grants: 'bg-module-grants text-ink',
      rooms: 'bg-module-rooms text-ink',
      equipment: 'bg-module-equipment text-white',
      events: 'bg-module-events text-ink',
    },
  },
});

const TILES = [
  { tone: 'grants', label: 'Subventions', icon: IconSubvention },
  { tone: 'rooms', label: 'Salles', icon: IconSalle },
  { tone: 'equipment', label: 'Matériel', icon: IconMateriel },
  { tone: 'events', label: 'Événements', icon: IconEvenement },
] as const;

const NAV = [
  { label: 'Accueil', icon: IconAccueil },
  { label: 'Subventions', icon: IconSubvention },
  { label: 'Salles', icon: IconSalle },
  { label: 'Matériel', icon: IconMateriel },
  { label: 'Historique', icon: IconHistorique },
];

const REQUESTS = [
  { title: 'Tournoi de printemps', meta: 'Subvention · 1 200 €' },
  { title: 'Gymnase · samedi 14 h', meta: 'Salle' },
  { title: '2 barnums, 10 tables', meta: 'Matériel' },
];

type Status = 'pending' | 'validated';

const statusVariants = cva('inline-flex rounded-pill px-2.5 py-1 text-caption font-bold whitespace-nowrap', {
  variants: {
    status: {
      pending: 'bg-accent text-ink',
      validated: 'bg-primary-soft text-primary',
    },
  },
});

/** Aperçu vivant de l'espace association : les demandes passent d'« en attente » à « validée ». */
export default function AppPreview() {
  const [validatedCount, setValidatedCount] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setValidatedCount((count) => (count + 1) % (REQUESTS.length + 1)), 1800);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div aria-hidden="true" className="flex overflow-hidden rounded-card border border-line bg-white text-left shadow-panel">
      <aside className="hidden w-48 shrink-0 border-r border-line p-4 md:block">
        <span className="block text-body-sm font-black tracking-tight text-primary">
          Feytiat<span className="text-brand-dot">.</span>
        </span>
        <ul className="mt-6 space-y-1">
          {NAV.map(({ label, icon: Icon }, index) => (
            <li
              key={label}
              className={`flex items-center gap-2.5 rounded-control px-2.5 py-2 text-meta font-bold ${index === 0 ? 'bg-primary text-white' : 'text-ink/70'}`}
            >
              <Icon className="size-4" />
              {label}
            </li>
          ))}
        </ul>
      </aside>

      <div className="min-w-0 flex-1 p-4 sm:p-6">
        <p className="text-body font-black text-ink sm:text-lg">Bonjour, Feytiat Basket</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {TILES.map(({ tone, label, icon: Icon }) => (
            <div key={tone} className={tileVariants({ tone })}>
              <Icon className="size-5" />
              <span className="mt-6 text-meta font-bold sm:mt-8">{label}</span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-meta font-bold text-muted">Suivi des demandes</p>
        <ul className="mt-2 divide-y divide-line">
          {REQUESTS.map((request, index) => {
            const status: Status = index < validatedCount ? 'validated' : 'pending';
            return (
              <li key={request.title} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate text-meta font-bold text-ink sm:text-body-sm">{request.title}</span>
                  <span className="block text-caption text-muted">{request.meta}</span>
                </span>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={status}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.25 }}
                    className={statusVariants({ status })}
                  >
                    {status === 'validated' ? 'Validée' : 'En attente'}
                  </motion.span>
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
