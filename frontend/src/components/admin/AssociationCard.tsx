import Link from 'next/link';
import { type Association } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';

interface AssociationCardProps {
  association: Association;
  compact?: boolean;
  className?: string;
}

export default function AssociationCard({
  association,
  compact = false,
  className = '',
}: AssociationCardProps) {
  const formattedDate = association.createdAt
    ? new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(association.createdAt))
    : null;

  return (
    <Link
      href={`/admin/inscriptions/${association.id}`}
      className={`group flex items-center justify-between gap-4 rounded-[18px] border border-[var(--line)] bg-[var(--White)] shadow-xs transition-all duration-200 hover:border-[var(--Mosaic-Tile)]/40 hover:shadow-md ${
        compact ? 'p-4' : 'p-5 sm:p-6'
      } ${className}`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] sm:text-[1rem] font-bold uppercase tracking-tight text-[var(--ink)] group-hover:text-[var(--Mosaic-Tile)] transition-colors">
          {association.nom}
        </span>

        <span className="mt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
          <StatusBadge status={association.statut} />

          {formattedDate && (
            <span className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <svg
                className="h-3.5 w-3.5 text-[var(--muted)]/70"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Déposée le {formattedDate}</span>
            </span>
          )}

          {association.contact && (
            <span className="hidden text-xs text-[var(--muted)] sm:inline">
              · {association.contact.prenom} {association.contact.nom} ({association.contact.email})
            </span>
          )}
        </span>
      </span>

      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--ink)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--Mosaic-Tile)]">
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </span>
    </Link>
  );
}
