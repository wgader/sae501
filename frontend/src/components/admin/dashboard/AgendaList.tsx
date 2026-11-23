import Link from 'next/link';
import { IconCheck } from '@/components/ui/icons';
import { AGENDA_TYPES, agendaDate, agendaHref } from '@/lib/adminDashboard';
import type { AdminDashboardAgendaItem } from '@/lib/api/types';
import { toneDotVariants } from './toneVariants';

/** Salles occupées, matériel à remettre et évènements des sept prochains jours. */
export default function AgendaList({ items }: { items: AdminDashboardAgendaItem[] }) {
  if (items.length === 0) {
    return (
      <p className="flex items-center gap-3 rounded-soft bg-paper p-4 text-body-sm text-muted">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <IconCheck />
        </span>
        Aucune réservation ni aucun évènement prévu cette semaine.
      </p>
    );
  }

  return (
    <ol className="divide-y divide-line">
      {items.map((item) => {
        const { day, weekday, time } = agendaDate(item.startsAt);
        const type = AGENDA_TYPES[item.type];
        const details = [item.association, item.place].filter(Boolean).join(' · ');

        return (
          <li key={`${item.type}-${item.id}`}>
            <Link href={agendaHref(item)} className="group flex items-center gap-4 rounded-soft py-3 transition-colors hover:bg-paper sm:px-2">
              <time dateTime={item.startsAt} className="flex w-12 shrink-0 flex-col items-center rounded-soft bg-paper py-1.5 group-hover:bg-white">
                <span className="text-caption font-bold uppercase tracking-label text-muted">{weekday}</span>
                <span className="text-xl font-black leading-display text-ink">{day}</span>
              </time>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-meta font-semibold text-muted">
                  <span className={toneDotVariants({ tone: type.tone })} aria-hidden="true" />
                  {type.label} · {time}
                </p>
                <p className="mt-0.5 truncate text-body-sm font-bold text-ink group-hover:text-primary">{item.title}</p>
                {details && <p className="truncate text-meta text-muted">{details}</p>}
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
