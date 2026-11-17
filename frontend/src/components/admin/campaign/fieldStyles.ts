import { cva } from 'class-variance-authority';

/** Libellés et champs des formulaires de campagne, uniquement à partir des tokens du thème. */
export const fieldLabelVariants = cva('block text-label font-bold uppercase tracking-label text-ink');

export const fieldControlVariants = cva(
  'mt-2 w-full rounded-control border border-line bg-white px-4 py-3 text-body-sm text-ink placeholder:text-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-soft disabled:bg-paper',
  {
    variants: {
      invalid: {
        true: 'border-danger focus:border-danger focus:ring-danger/20',
        false: '',
      },
    },
    defaultVariants: {
      invalid: false,
    },
  },
);

export const fieldHintVariants = cva('mt-1.5 text-meta', {
  variants: {
    tone: {
      muted: 'text-muted',
      danger: 'font-semibold text-danger',
    },
  },
  defaultVariants: {
    tone: 'muted',
  },
});
