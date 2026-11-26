import { cva } from 'class-variance-authority';

/** Les attributions sont toutes acceptées ; seule la suite donnée diffère (en cours ou terminée). */
const badgeVariants = cva('inline-flex shrink-0 items-center rounded-pill px-3 py-1 text-caption font-bold uppercase tracking-label', {
  variants: {
    tone: {
      granted: 'bg-primary-soft text-primary',
      done: 'bg-paper text-muted',
    },
  },
  defaultVariants: { tone: 'granted' },
});

const DONE_STATUSES = ['Clôturée', 'Matériel restitué'];

export default function AttributionStatusBadge({ status }: { status: string | null }) {
  const label = status ?? 'Validée';
  return <span className={badgeVariants({ tone: DONE_STATUSES.includes(label) ? 'done' : 'granted' })}>{label}</span>;
}
