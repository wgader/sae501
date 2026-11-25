import { cva } from 'class-variance-authority';

/** Fond plein d'une carte de démarche, identique aux cartes de l'accueil associations. */
export const toneSurfaceVariants = cva('', {
  variants: {
    tone: {
      registrations: 'bg-primary text-white',
      grants: 'bg-module-grants text-ink',
      rooms: 'bg-module-rooms text-ink',
      equipment: 'bg-module-equipment text-white',
      events: 'bg-module-events text-ink',
    },
  },
});

/** Texte secondaire lisible sur chaque fond. */
export const toneSoftTextVariants = cva('', {
  variants: {
    tone: {
      registrations: 'text-white/80',
      grants: 'text-ink/70',
      rooms: 'text-ink/70',
      equipment: 'text-white/80',
      events: 'text-ink/70',
    },
  },
});

/** Pastille de couleur posée sur fond blanc (agenda, légendes). */
export const toneDotVariants = cva('inline-block size-2.5 shrink-0 rounded-full', {
  variants: {
    tone: {
      registrations: 'bg-primary',
      grants: 'bg-module-grants ring-1 ring-ink/10',
      rooms: 'bg-module-rooms ring-1 ring-ink/10',
      equipment: 'bg-module-equipment',
      events: 'bg-module-events ring-1 ring-ink/10',
    },
  },
});
