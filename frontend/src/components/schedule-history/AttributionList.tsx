import type { ScheduleAttribution } from '@/lib/api';
import { groupByMonth } from '@/lib/scheduleHistory';
import AttributionRow from './AttributionRow';

interface AttributionListProps {
  attributions: ScheduleAttribution[];
  annexHref?: (attribution: ScheduleAttribution) => string;
}

/** Attributions de l’année, regroupées par mois, de la plus récente à la plus ancienne. */
export default function AttributionList({ attributions, annexHref }: AttributionListProps) {
  return (
    <div className="space-y-5">
      {groupByMonth(attributions).map((group) => (
        <section key={group.label} aria-label={group.label}>
          <h4 className="mb-2 text-label font-bold uppercase tracking-label text-muted first-letter:uppercase">{group.label}</h4>
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-white">
            {group.items.map((attribution) => (
              <li key={`${attribution.type}-${attribution.id}`}>
                <AttributionRow attribution={attribution} annexHref={annexHref?.(attribution)} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
