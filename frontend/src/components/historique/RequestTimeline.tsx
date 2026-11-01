import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import type { RequestTimelineEvent } from '@/lib/api';
import RequestStatusBadge from './RequestStatusBadge';

export interface RequestTimelineProps extends HTMLAttributes<HTMLDivElement> {
  timeline: RequestTimelineEvent[];
}

export function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export default function RequestTimeline({
  timeline,
  className,
  ...props
}: RequestTimelineProps) {
  if (timeline.length === 0) {
    return (
      <p className="text-sm italic text-muted">
        Aucun événement d&apos;historique disponible pour ce dossier.
      </p>
    );
  }

  return (
    <div className={cn('relative space-y-6', className)} {...props}>
      <ol className="relative border-l border-line ml-3.5 space-y-6">
        {timeline.map((event, index) => {
          const isLast = index === timeline.length - 1;
          const formattedDate = formatDateTime(event.date);

          return (
            <li key={event.id || `${event.statut}-${index}`} className="relative pl-6">
              {/* Timeline marker */}
              <span
                className={cn(
                  'absolute -left-2 top-1.5 flex h-4 w-4 items-center justify-center rounded-pill border-2 border-white',
                  isLast ? 'bg-primary' : 'bg-muted/50',
                )}
                aria-hidden="true"
              >
                <span className="h-1.5 w-1.5 rounded-pill bg-white" />
              </span>

              <header className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-bold text-ink">
                    {event.label}
                  </h4>
                  <RequestStatusBadge statusLabel={event.statut} size="sm" />
                </div>

                <div className="flex items-center gap-2 text-meta text-muted">
                  <time dateTime={event.date}>{formattedDate}</time>
                  {event.auteur && (
                    <span className="rounded-soft bg-paper px-2 py-0.5 text-caption font-bold text-muted border border-line">
                      {event.auteur}
                    </span>
                  )}
                </div>
              </header>

              {event.commentaire && (
                <div className="mt-2.5 rounded-soft border border-line/70 bg-paper p-3 text-xs leading-relaxed text-ink/90">
                  <p>{event.commentaire}</p>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

