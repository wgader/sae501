import type { ScheduleAttribution } from '@/lib/api';
import AttributionCard from './AttributionCard';

interface AttributionTimelineProps {
  attributions: ScheduleAttribution[];
  annexHref?: (attribution: ScheduleAttribution) => string;
}

/** Frise des attributions de l’année, de la plus récente à la plus ancienne. */
export default function AttributionTimeline({ attributions, annexHref }: AttributionTimelineProps) {
  return (
    <ol className="space-y-6">
      {attributions.map((attribution) => (
        <li key={`${attribution.type}-${attribution.id}`} className="flex gap-4 sm:gap-10">
          <span className="mt-2 size-3 shrink-0 rounded-pill bg-primary ring-4 ring-accent" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <AttributionCard attribution={attribution} annexHref={annexHref?.(attribution)} />
          </div>
        </li>
      ))}
    </ol>
  );
}
