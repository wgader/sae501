'use client';

import { useState } from 'react';
import type { ScheduleAttribution } from '@/lib/api';
import Notice from '@/components/ui/Notice';
import SectionHeader from '@/components/ui/SectionHeader';
import { useScheduleHistory } from '@/hooks/useScheduleHistory';
import { plural } from '@/lib/scheduleHistory';
import AttributionList from './AttributionList';
import AttributionRecap from './AttributionRecap';
import AttributionTypeFilter, { type AttributionFilter } from './AttributionTypeFilter';
import HistoryYearTabs from './HistoryYearTabs';

interface ScheduleHistoryPanelProps {
  /** Absent : l’association connectée consulte son propre bilan. */
  associationId?: number;
  title?: string;
  description?: string;
  annexHref?: (attribution: ScheduleAttribution) => string;
}

/** Historique par année des salles et du matériel attribués à une association. */
export default function ScheduleHistoryPanel({
  associationId,
  title = 'Historique des réservations',
  description = 'Salles et matériel attribués à l’association, année par année.',
  annexHref,
}: ScheduleHistoryPanelProps) {
  const { history, years, activeYear, setSelectedYear, isLoading, error } = useScheduleHistory(associationId);
  const [filter, setFilter] = useState<AttributionFilter>('all');

  const total = history ? history.totals.roomReservationCount + history.totals.equipmentReservationCount : 0;
  const attributions = activeYear?.attributions ?? [];
  const visible = filter === 'all' ? attributions : attributions.filter((attribution) => attribution.type === filter);
  const counts = {
    all: attributions.length,
    salle: activeYear?.roomReservationCount ?? 0,
    materiel: activeYear?.equipmentReservationCount ?? 0,
  };

  return (
    <section aria-labelledby="schedule-history-title" className="space-y-6">
      <SectionHeader
        id="schedule-history-title"
        title={title}
        description={description}
        actions={
          history && (
            <span className="rounded-pill border border-line bg-paper px-3 py-1 text-xs font-semibold text-muted">
              {plural(total, 'attribution')} au total
            </span>
          )
        }
      />

      {isLoading && <p role="status" className="rounded-card border border-line bg-white p-6 text-sm text-muted">Chargement de l’historique…</p>}
      {error && <Notice tone="danger">{error}</Notice>}

      {!isLoading && !error && !activeYear && (
        <p className="rounded-card border border-line bg-white p-6 text-sm italic text-muted">
          Aucune salle ni aucun matériel n’a encore été attribué à cette association.
        </p>
      )}

      {activeYear && (
        <>
          <HistoryYearTabs years={years} selected={activeYear.year} onSelect={(year) => {
            setSelectedYear(year);
            setFilter('all');
          }} />
          <AttributionRecap year={activeYear} />

          <section aria-labelledby="history-list-title" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 id="history-list-title" className="text-xs font-bold uppercase tracking-wider text-ink">
                Détail {activeYear.year}
              </h3>
              <AttributionTypeFilter value={filter} counts={counts} onChange={setFilter} />
            </div>
            {visible.length > 0 ? (
              <AttributionList attributions={visible} annexHref={annexHref} />
            ) : (
              <p className="rounded-card border border-line bg-white p-6 text-sm italic text-muted">Rien de ce type cette année.</p>
            )}
          </section>
        </>
      )}
    </section>
  );
}
