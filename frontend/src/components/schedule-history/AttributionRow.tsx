import Link from 'next/link';
import type { ScheduleAttribution } from '@/lib/api';
import { IconMateriel, IconSalle } from '@/components/ui/icons';
import { attributionTitle, dateBadge, formatDayRange, formatHours, formatTimeRange } from '@/lib/scheduleHistory';
import AttributionStatusBadge from './AttributionStatusBadge';
import { ATTRIBUTION_LABELS, attributionIconVariants } from './attributionTone';

interface AttributionRowProps {
  attribution: ScheduleAttribution;
  /** Lien vers les pièces du dossier (côté mairie). */
  annexHref?: string;
}

/** Une salle ou un prêt de matériel : date, quoi, quand, pourquoi, statut. */
export default function AttributionRow({ attribution, annexHref }: AttributionRowProps) {
  const date = dateBadge(attribution.start);
  const when = attribution.type === 'salle'
    ? `${formatTimeRange(attribution.start, attribution.end)} · ${formatHours(attribution.hours)}`
    : formatDayRange(attribution.start, attribution.end);

  return (
    <article className="flex flex-wrap gap-x-4 gap-y-3 p-4 sm:flex-nowrap sm:items-center sm:p-5">
      <time dateTime={attribution.start} className="flex w-12 shrink-0 flex-col items-center self-start rounded-soft bg-paper py-2 text-ink">
        <span className="text-lg font-black leading-none">{date.day}</span>
        <span className="mt-1 text-caption font-bold uppercase text-muted">{date.month}</span>
      </time>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-caption font-bold uppercase tracking-label text-muted">
          <span className={attributionIconVariants({ type: attribution.type, size: 'sm' })} aria-hidden="true">
            {attribution.type === 'salle' ? <IconSalle className="size-3" /> : <IconMateriel className="size-3" />}
          </span>
          {ATTRIBUTION_LABELS[attribution.type]}
          {attribution.type === 'salle' && attribution.campagne && <span className="hidden font-semibold normal-case tracking-normal sm:inline">· campagne {attribution.campagne}</span>}
        </p>
        <h4 className="mt-1 truncate text-sm font-bold text-ink">{attributionTitle(attribution)}</h4>
        <p className="mt-0.5 text-xs text-muted">
          {when}
          {attribution.motifEvenement && <> · <span className="text-ink">{attribution.motifEvenement}</span></>}
        </p>
      </div>

      {/* Sur mobile, statut et lien passent sous le contenu, alignés avec le texte. */}
      <div className="flex w-full items-center justify-between gap-2 pl-16 sm:w-auto sm:shrink-0 sm:flex-col sm:items-end sm:pl-0">
        <AttributionStatusBadge status={attribution.statut} />
        {annexHref && (
          <Link href={annexHref} className="text-xs font-bold uppercase tracking-label text-primary hover:underline">
            Pièces
          </Link>
        )}
      </div>
    </article>
  );
}
