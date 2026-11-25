import Link from 'next/link';
import { IconArrowRight } from '@/components/ui/icons';
import { plural, type PendingQueue } from '@/lib/adminDashboard';
import { cn } from '@/lib/utils';
import { toneSoftTextVariants, toneSurfaceVariants } from './toneVariants';

interface PendingQueueCardProps {
  queue: PendingQueue;
  count: number;
  className?: string;
}

/** Une file d'attente : le nombre de dossiers à traiter et l'accès direct à la liste. */
export default function PendingQueueCard({ queue, count, className }: PendingQueueCardProps) {
  const { tone } = queue;
  const done = count === 0;

  return (
    <Link
      href={queue.href}
      className={cn(
        'group relative flex h-full min-h-44 flex-col justify-between overflow-hidden rounded-card p-4 sm:min-h-52 sm:p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-card',
        toneSurfaceVariants({ tone }),
        className,
      )}
    >
      <span
        className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full border-14 border-current opacity-10 transition-transform duration-300 group-hover:scale-110"
        aria-hidden="true"
      />

      <div className="relative">
        <p className={cn('text-label font-bold uppercase tracking-kicker', toneSoftTextVariants({ tone }))}>{queue.label}</p>
        <p className="mt-3 text-4xl font-black sm:mt-4 sm:text-5xl leading-display tracking-display">{count}</p>
        <p className={cn('mt-2 text-body-sm font-semibold', done ? toneSoftTextVariants({ tone }) : undefined)}>
          {done ? 'Rien en attente' : plural(count, queue.task)}
        </p>
      </div>

      <span className="relative mt-5 flex items-center justify-between border-t border-current/15 pt-3 text-label font-bold uppercase tracking-kicker">
        {done ? 'Voir la liste' : 'Traiter'}
        <span
          className="grid size-8 place-items-center rounded-full bg-ink text-white transition-all duration-200 group-hover:scale-110 group-hover:bg-white group-hover:text-ink"
          aria-hidden="true"
        >
          <IconArrowRight />
        </span>
      </span>
    </Link>
  );
}
