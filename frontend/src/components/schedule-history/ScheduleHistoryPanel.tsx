'use client';

import type { ScheduleAttribution } from '@/lib/api';
import Notice from '@/components/ui/Notice';
import { useScheduleHistory } from '@/hooks/useScheduleHistory';
import { plural } from '@/lib/scheduleHistory';
import AttributionRecap from './AttributionRecap';
import AttributionTimeline from './AttributionTimeline';
import HistoryYearSelect from './HistoryYearSelect';

interface ScheduleHistoryPanelProps {
  /** Absent : l’association connectée consulte son propre bilan. */
  associationId?: number;
  title?: string;
  annexHref?: (attribution: ScheduleAttribution) => string;
}

/** Historique par année des salles et du matériel attribués à une association. */
export default function ScheduleHistoryPanel({ associationId, title = 'Historique du dossier', annexHref }: ScheduleHistoryPanelProps) {
  const { years, activeYear, setSelectedYear, isLoading, error } = useScheduleHistory(associationId);

  return (
    <section aria-labelledby="schedule-history-title" className="space-y-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="schedule-history-title" className="text-body-lg font-bold uppercase tracking-eyebrow text-ink">{title}</h2>
          <p className="mt-3 text-body-lg text-muted">Retrouvez les salles et le matériel attribués à l’association, par année.</p>
        </div>
        {activeYear && (
          <HistoryYearSelect years={years.map((year) => year.year)} value={activeYear.year} onChange={setSelectedYear} />
        )}
      </header>

      {isLoading && <p role="status" className="py-12 text-center text-body-sm text-muted">Chargement de l’historique…</p>}
      {error && <Notice tone="danger">{error}</Notice>}

      {!isLoading && !error && !activeYear && (
        <p className="rounded-soft border border-line bg-paper p-8 text-center text-body text-muted">
          Aucune salle ni aucun matériel n’a encore été attribué à cette association.
        </p>
      )}

      {activeYear && (
        <section aria-labelledby="history-year-title" className="space-y-8">
          <h3 id="history-year-title" className="flex items-baseline gap-4">
            <span className="text-3xl font-black text-primary">{activeYear.year}</span>
            <span className="text-body text-muted">{plural(activeYear.attributions.length, 'attribution renseignée', 'attributions renseignées')}</span>
          </h3>
          <AttributionRecap year={activeYear} />
          <AttributionTimeline attributions={activeYear.attributions} annexHref={annexHref} />
        </section>
      )}

      <p className="border-t border-line pt-8 text-body-lg text-muted">
        L’historique présente les salles et le matériel attribués par la mairie à l’association.
      </p>
    </section>
  );
}
