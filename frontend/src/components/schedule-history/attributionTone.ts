import { cva } from 'class-variance-authority';

/** Pastille du type d’attribution, aux couleurs des modules Salles et Matériel. */
export const attributionIconVariants = cva('grid shrink-0 place-items-center', {
  variants: {
    type: {
      salle: 'bg-module-rooms text-ink',
      materiel: 'bg-module-equipment text-white',
    },
    size: {
      md: 'size-10 rounded-soft',
      sm: 'size-5 rounded-pill',
    },
  },
  defaultVariants: { size: 'md' },
});

export const ATTRIBUTION_LABELS = { salle: 'Salle', materiel: 'Matériel' } as const;
