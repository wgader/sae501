import type { ScheduleHistoryYear } from '@/lib/api';
import { formatHours, plural } from '@/lib/scheduleHistory';
import RecapBarTable from './RecapBarTable';

/** Synthèse de l’année : trois chiffres clés puis la répartition par salle et par matériel. */
export default function AttributionRecap({ year }: { year: ScheduleHistoryYear }) {
  const figures = [
    { label: 'Créneaux de salle', value: String(year.roomReservationCount) },
    { label: 'Heures de salle', value: formatHours(year.roomHoursGranted) },
    { label: 'Matériel prêté', value: plural(year.equipmentQuantity, 'unité') },
  ];

  return (
    <section aria-labelledby={`recap-${year.year}`} className="space-y-4">
      <h4 id={`recap-${year.year}`} className="sr-only">Bilan {year.year}</h4>
      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        {figures.map((figure) => (
          <div key={figure.label} className="rounded-soft border border-line bg-white p-3 sm:p-5">
            <dt className="text-caption font-bold uppercase text-muted sm:text-label sm:tracking-label">{figure.label}</dt>
            <dd className="mt-2 text-xl font-black tracking-display text-ink sm:text-3xl">{figure.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecapBarTable
          caption="Salles"
          columns={['Salle', 'Créneaux', 'Heures attribuées']}
          emptyLabel="Aucune salle cette année."
          rows={year.rooms.map((room) => ({
            key: room.id,
            label: room.nom ?? 'Salle',
            count: String(room.reservationCount),
            value: room.hours,
            valueLabel: formatHours(room.hours),
          }))}
        />
        <RecapBarTable
          caption="Matériel"
          columns={['Matériel', 'Prêts', 'Quantité']}
          emptyLabel="Aucun matériel cette année."
          rows={year.equipment.map((item) => ({
            key: item.id,
            label: item.designation ?? 'Matériel',
            count: String(item.reservationCount),
            value: item.quantity,
            valueLabel: String(item.quantity),
          }))}
        />
      </div>
    </section>
  );
}
