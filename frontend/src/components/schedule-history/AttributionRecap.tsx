import { IconMateriel, IconSalle } from '@/components/ui/icons';
import type { ScheduleHistoryYear } from '@/lib/api';
import { formatHours, plural } from '@/lib/scheduleHistory';
import { attributionIconVariants } from './attributionTone';
import RecapBarList from './RecapBarList';

/** Bilan de l’année dans une seule carte : chiffres clés puis répartition par salle et par matériel. */
export default function AttributionRecap({ year }: { year: ScheduleHistoryYear }) {
  return (
    <section aria-labelledby={`recap-${year.year}`} className="rounded-card border border-line bg-white p-5 sm:p-6">
      <h3 id={`recap-${year.year}`} className="text-xs font-bold uppercase tracking-wider text-ink">Bilan {year.year}</h3>

      <div className="mt-5 grid gap-6 lg:grid-cols-3">
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <div className="flex items-center gap-3">
            <span className={attributionIconVariants({ type: 'salle' })} aria-hidden="true"><IconSalle /></span>
            <div>
              <dt className="text-caption font-bold uppercase tracking-label text-muted">Salles</dt>
              <dd className="text-body font-black text-ink">
                {formatHours(year.roomHoursGranted)}
                <span className="ml-1 text-xs font-semibold text-muted">· {plural(year.roomReservationCount, 'créneau', 'créneaux')}</span>
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={attributionIconVariants({ type: 'materiel' })} aria-hidden="true"><IconMateriel /></span>
            <div>
              <dt className="text-caption font-bold uppercase tracking-label text-muted">Matériel</dt>
              <dd className="text-body font-black text-ink">
                {plural(year.equipmentQuantity, 'unité')}
                <span className="ml-1 text-xs font-semibold text-muted">· {plural(year.equipmentReservationCount, 'prêt')}</span>
              </dd>
            </div>
          </div>
        </dl>

        <RecapBarList
          title="Heures par salle"
          emptyLabel="Aucune salle cette année."
          rows={year.rooms.map((room) => ({ key: room.id, label: room.nom ?? 'Salle', value: room.hours, valueLabel: formatHours(room.hours) }))}
        />
        <RecapBarList
          title="Matériel prêté"
          emptyLabel="Aucun matériel cette année."
          rows={year.equipment.map((item) => ({ key: item.id, label: item.designation ?? 'Matériel', value: item.quantity, valueLabel: String(item.quantity) }))}
        />
      </div>
    </section>
  );
}
