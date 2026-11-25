import { cva } from 'class-variance-authority';
import { IconCheck } from '@/components/ui/icons';

/** Les attributions sont toutes acceptées ; seule la suite donnée diffère (en cours ou terminée). */
const badgeVariants = cva(
  'inline-flex shrink-0 items-center gap-1.5 rounded-pill px-4 py-2 text-meta font-bold uppercase',
  {
    variants: {
      tone: {
        granted: 'bg-primary-soft text-primary',
        done: 'bg-sand text-ink',
      },
    },
    defaultVariants: { tone: 'granted' },
  },
);

const DONE_STATUSES = ['Clôturée', 'Matériel restitué'];

export default function AttributionStatusBadge({ status }: { status: string | null }) {
  const label = status ?? 'Validée';
  return (
    <span className={badgeVariants({ tone: DONE_STATUSES.includes(label) ? 'done' : 'granted' })}>
      <IconCheck className="size-4" />
      {label}
    </span>
  );
}
