import Link from 'next/link';
import type { ScheduleAttribution } from '@/lib/api';
import { IconCalendar } from '@/components/ui/icons';
import { attributionTitle, formatHours, formatLongDate, formatTimeRange } from '@/lib/scheduleHistory';
import AttributionStatusBadge from './AttributionStatusBadge';

interface AttributionCardProps {
  attribution: ScheduleAttribution;
  /** Lien vers les pièces du dossier (côté mairie). */
  annexHref?: string;
}

/** Une salle ou un prêt de matériel attribué, présenté comme une étape de l’historique. */
export default function AttributionCard({ attribution, annexHref }: AttributionCardProps) {
  const isRoom = attribution.type === 'salle';
  const status = (attribution.statut ?? 'Validée').toLowerCase();

  return (
    <article className="rounded-soft border border-line bg-paper p-6 sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <p className="flex items-center gap-2 text-body-lg font-bold text-primary">
          <IconCalendar />
          <time dateTime={attribution.start}>{formatLongDate(attribution.start)}</time>
        </p>
        <AttributionStatusBadge status={attribution.statut} />
      </header>

      <h4 className="mt-6 text-xl font-bold tracking-subheading text-ink sm:text-2xl">{attributionTitle(attribution)}</h4>
      <p className="mt-2 text-body text-muted">
        {isRoom
          ? `${formatTimeRange(attribution.start, attribution.end)} · ${formatHours(attribution.hours)}${attribution.campagne ? ` · campagne ${attribution.campagne}` : ''}`
          : `Du ${formatLongDate(attribution.start)} au ${formatLongDate(attribution.end)}`}
        {` — statut actuel de la demande : ${status}.`}
      </p>

      <div className="mt-6 grid gap-6 border-t border-line pt-6 sm:grid-cols-2">
        <section>
          <h5 className="text-meta font-bold uppercase text-muted">Objet de la demande</h5>
          <p className="mt-2 text-body-lg text-ink">{attribution.motifEvenement || 'Non précisé'}</p>
        </section>
        {attribution.type === 'materiel' && (
          <section>
            <h5 className="text-meta font-bold uppercase text-muted">Matériel prêté</h5>
            <ul className="mt-2 space-y-1 text-body-lg text-ink">
              {attribution.lignes.map((line) => (
                <li key={line.materielId}>
                  <span className="font-bold">{line.quantite} ×</span> {line.designation ?? 'Matériel'}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {annexHref && (
        <footer className="mt-6 flex justify-end">
          <Link href={annexHref} className="text-meta font-bold uppercase tracking-label text-primary hover:underline">
            Pièces du dossier
          </Link>
        </footer>
      )}
    </article>
  );
}
