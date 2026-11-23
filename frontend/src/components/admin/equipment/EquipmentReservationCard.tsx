import Link from 'next/link';
import type { AdminEquipmentReservation } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';

type Props = { reservation: AdminEquipmentReservation };

export default function EquipmentReservationCard({ reservation }: Props) {
  const associationName = reservation.association.nom || 'Association non renseignée';
  const formattedDate = reservation.createdAt
    ? new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(reservation.createdAt))
    : null;
  const status = reservation.statut === 'En attente'
    ? 'PENDING_VALIDATION'
    : reservation.statut === 'Validée'
      ? 'VALIDATED'
      : 'REFUSED';

  return (
    <li>
      <Link
        href={`/admin/materiel/demandes/${reservation.id}`}
        className="group flex items-center justify-between gap-4 rounded-card border border-line bg-white p-5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md sm:p-6"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-bold uppercase tracking-tight text-ink transition-colors group-hover:text-primary sm:text-base">
            {associationName}
          </span>
          <span className="mt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
            <StatusBadge status={status} />
            {formattedDate && (
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <svg className="h-3.5 w-3.5 text-muted/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Déposée le {formattedDate}</span>
              </span>
            )}
            <span className="hidden text-xs text-muted sm:inline">
              · {reservation.association.contact.prenom} {reservation.association.contact.nom} ({reservation.association.contact.email})
            </span>
          </span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill text-ink transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </Link>
    </li>
  );
}
