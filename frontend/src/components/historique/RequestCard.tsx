import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import type { AssociationRequestSummary } from '@/lib/api';
import RequestStatusBadge from './RequestStatusBadge';
import RequestTypeBadge from './RequestTypeBadge';

export interface RequestCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  request: AssociationRequestSummary;
  onSelect: (id: string, type: string) => void;
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export default function RequestCard({
  request,
  onSelect,
  className,
  ...props
}: RequestCardProps) {
  const depositDate = formatDate(request.keyDates?.depot || request.createdAt);

  return (
    <article
      className={cn(
        'group relative flex flex-col justify-between gap-4 rounded-card border border-line bg-white p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-card md:flex-row md:items-center',
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
        {/* Type badge */}
        <div className="shrink-0">
          <RequestTypeBadge requestType={request.type} label={request.typeLabel} />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-ink group-hover:text-primary transition-colors">
            {request.intitule}
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted">
            {request.summary}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-4 border-t border-line/50 pt-3 md:border-t-0 md:pt-0">
        {/* Deposit date */}
        <div className="text-left md:text-right">
          <span className="block text-caption font-bold uppercase tracking-label text-muted">
            Déposé le
          </span>
          <time
            dateTime={request.createdAt}
            className="text-xs font-semibold text-ink"
          >
            {depositDate}
          </time>
        </div>

        {/* Current status */}
        <div className="shrink-0">
          <RequestStatusBadge statusLabel={request.statut} />
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={() => onSelect(request.id, request.type)}
          aria-label={`Consulter le détail du dossier ${request.intitule}`}
          className="inline-flex h-9 items-center justify-center rounded-control border border-line bg-paper px-3.5 text-xs font-bold uppercase tracking-label text-ink transition-colors hover:border-primary hover:bg-primary hover:text-white cursor-pointer"
        >
          Détail
          <svg
            className="ml-1.5 h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </article>
  );
}

