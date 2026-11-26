import RequestInfoField from '@/components/admin/equipment/request/RequestInfoField';
import type { AdminEquipmentReservation } from '@/lib/api';
import EquipmentPhoto from '@/components/admin/equipment/requests/EquipmentPhoto';

interface EquipmentRequestDetailsCardProps {
  reservation: AdminEquipmentReservation;
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDate(value: string | null): string {
  return value ? dateFormatter.format(new Date(value)) : 'Date non renseignée';
}

export default function EquipmentRequestDetailsCard({ reservation }: EquipmentRequestDetailsCardProps) {
  return (
    <section aria-labelledby="request-details-title" className="rounded-card border border-line bg-white p-5 sm:p-6">
      <h2 id="request-details-title" className="text-lg font-black text-ink">
        Réservation
      </h2>
      <dl className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
        <RequestInfoField label="Retrait">{formatDate(reservation.dateRetrait)}</RequestInfoField>
        <RequestInfoField label="Restitution">{formatDate(reservation.dateRestitution)}</RequestInfoField>
        <div className="sm:col-span-2">
          <RequestInfoField label="Motif de l’événement">{reservation.motifEvenement || 'Non renseigné'}</RequestInfoField>
        </div>
      </dl>

      <h3 className="mt-5 text-label font-bold uppercase tracking-label text-muted">Matériel demandé</h3>
      <ul className="mt-2 space-y-2">
        {reservation.lignes.map((line) => (
          <li key={line.materielId} className="flex items-center justify-between gap-4 rounded-soft bg-paper px-3 py-2.5 text-body-sm">
            <span className="flex min-w-0 items-center gap-3">
              <span className="relative size-12 shrink-0 overflow-hidden rounded-soft bg-white">
                <EquipmentPhoto path={line.imagePath} alt={line.designation ?? 'Matériel'} sizes="48px" />
              </span>
              <span className="min-w-0 font-semibold text-ink">{line.designation || 'Matériel supprimé'}</span>
            </span>
            <span className="shrink-0 font-bold text-primary">
              {line.quantite ?? 0} unité{(line.quantite ?? 0) > 1 ? 's' : ''}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
