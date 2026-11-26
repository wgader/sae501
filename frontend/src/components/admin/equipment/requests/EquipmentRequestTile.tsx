import Link from 'next/link';
import type { AdminEquipmentReservation } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatBorrowPeriod, formatSubmittedAt, requestStatusBadge, totalUnits } from '@/lib/equipmentRequests';
import { plural } from '@/lib/scheduleHistory';
import { routes } from '@/lib/routes';
import EquipmentPhoto from './EquipmentPhoto';

/** Vue cartes : la photo du premier matériel en grand, puis le détail de la demande. */
export default function EquipmentRequestTile({ reservation }: { reservation: AdminEquipmentReservation }) {
  const badge = requestStatusBadge(reservation.statut);
  const [first, ...others] = reservation.lignes;
  const period = formatBorrowPeriod(reservation.dateRetrait, reservation.dateRestitution);

  return (
    <Link
      href={routes.adminEquipmentRequest(reservation.id ?? 0)}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
    >
      <span className="relative block h-40 shrink-0 bg-paper">
        <EquipmentPhoto
          path={first?.imagePath}
          alt={first?.designation ?? 'Matériel demandé'}
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          fallbackIconClassName="size-12"
        />
        <span className="absolute left-3 top-3">
          <StatusBadge status={badge.status} label={badge.label} />
        </span>
        <span className="absolute bottom-3 right-3 rounded-pill bg-white px-3 py-1 text-caption font-bold uppercase tracking-label text-ink shadow-xs">
          {plural(totalUnits(reservation), 'unité')}
        </span>
      </span>

      <span className="flex flex-1 flex-col p-5">
        <span className="truncate text-body font-bold uppercase text-ink transition-colors group-hover:text-primary">
          {reservation.association.nom || 'Association non renseignée'}
        </span>
        {reservation.motifEvenement && <span className="mt-1 line-clamp-1 text-xs text-muted">{reservation.motifEvenement}</span>}

        <span className="mt-4 block space-y-1 text-sm text-ink">
          {first && (
            <span className="block truncate">
              <span className="font-bold">{first.quantite ?? 0} ×</span> {first.designation ?? 'Matériel supprimé'}
            </span>
          )}
          {others.length > 0 && <span className="block text-xs text-muted">+ {plural(others.length, 'autre équipement', 'autres équipements')}</span>}
        </span>

        <span className="mt-auto flex flex-wrap justify-between gap-2 border-t border-line pt-3 text-xs text-muted">
          {period && <span className="font-semibold text-ink">{period}</span>}
          <span>{formatSubmittedAt(reservation.createdAt)}</span>
        </span>
      </span>
    </Link>
  );
}
