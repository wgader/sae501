import Link from 'next/link';
import type { AdminEquipmentReservation } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import { IconArrowRight } from '@/components/ui/icons';
import { formatBorrowPeriod, formatSubmittedAt, linesSummary, requestStatusBadge } from '@/lib/equipmentRequests';
import { routes } from '@/lib/routes';
import EquipmentThumbnails from './EquipmentThumbnails';

/** Vue liste : photos du matériel, association, matériel demandé, période et statut sur une ligne. */
export default function EquipmentRequestRow({ reservation }: { reservation: AdminEquipmentReservation }) {
  const badge = requestStatusBadge(reservation.statut);
  const period = formatBorrowPeriod(reservation.dateRetrait, reservation.dateRestitution);
  const submitted = formatSubmittedAt(reservation.createdAt);

  return (
    <Link
      href={routes.adminEquipmentRequest(reservation.id ?? 0)}
      className="group flex flex-wrap items-center gap-4 rounded-card border border-line bg-white p-4 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-card sm:flex-nowrap sm:p-5"
    >
      <EquipmentThumbnails lines={reservation.lignes} />

      <span className="min-w-0 flex-1 basis-full sm:basis-48">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate text-body font-bold uppercase text-ink transition-colors group-hover:text-primary">
            {reservation.association.nom || 'Association non renseignée'}
          </span>
          <StatusBadge status={badge.status} label={badge.label} />
        </span>
        <span className="mt-1 block truncate text-sm text-ink">{linesSummary(reservation)}</span>
        <span className="mt-1 block text-xs text-muted">
          {[period && `Emprunt ${period}`, reservation.motifEvenement, submitted].filter(Boolean).join(' · ')}
        </span>
      </span>

      <span className="hidden size-9 shrink-0 items-center justify-center rounded-pill text-ink transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary sm:flex" aria-hidden="true">
        <IconArrowRight />
      </span>
    </Link>
  );
}
