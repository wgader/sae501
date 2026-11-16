'use client';

import { useId, useState, type CSSProperties } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { IconChevronLeft, IconChevronRight, IconWarning } from '@/components/ui/icons';
import { fieldControlVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';
import { CAMPAIGN_REQUEST_STATUS_LABELS } from '@/components/admin/campaign/CampaignRequestStatusBadge';
import { formatDayLabel, formatSlotTime, slotDate } from '@/lib/campaignDates';
import {
  PLANNING_FIRST_HOUR,
  PLANNING_HOURS,
  PLANNING_SLOTS,
  addDays,
  initialWeek,
  monthLabel,
  placeDay,
  startOfWeek,
  todayKey,
  weekDays,
  weekLabel,
} from '@/lib/campaignPlanning';
import type { CampaignRequest } from '@/lib/api/types';

interface Option {
  id: number;
  nom: string;
}

interface CampaignPlanningProps {
  requests: CampaignRequest[];
  salles: Option[];
  onSelect: (request: CampaignRequest) => void;
}

const eventVariants = cva(
  'planning-event m-0.5 flex min-w-0 flex-col overflow-hidden rounded-control px-2 py-1 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer',
  {
    variants: {
      status: {
        pending: 'bg-accent text-ink hover:bg-accent/80',
        accepted: 'bg-primary text-white hover:bg-primary-hover',
        refused: 'bg-paper text-muted line-through ring-1 ring-line hover:bg-line',
        closed: 'bg-paper text-muted ring-1 ring-line',
      },
      conflict: {
        true: 'ring-2 ring-danger',
        false: '',
      },
    },
    defaultVariants: { status: 'pending', conflict: false },
  },
);

const dayTabVariants = cva(
  'flex flex-col items-center gap-0.5 rounded-control py-1.5 text-caption font-bold uppercase transition-colors cursor-pointer',
  {
    variants: {
      selected: {
        true: 'bg-primary text-white',
        false: 'text-muted hover:bg-paper',
      },
    },
  },
);

const dayDotVariants = cva('h-1 w-1 rounded-pill', {
  variants: {
    visible: { true: '', false: 'invisible' },
    selected: { true: 'bg-white', false: 'bg-primary' },
  },
});

const dayNumberVariants = cva('flex h-8 w-8 items-center justify-center rounded-pill text-body font-black', {
  variants: {
    today: { true: 'bg-primary text-white', false: 'text-ink' },
  },
});

const legendDotVariants = cva('h-3 w-3 shrink-0 rounded-sm', {
  variants: {
    tone: {
      pending: 'bg-accent',
      accepted: 'bg-primary',
      conflict: 'bg-white ring-2 ring-danger ring-inset',
    },
  },
});

/**
 * Planning hebdomadaire des demandes de la campagne : une colonne par jour (un seul jour sur
 * mobile), une ligne par demi-heure. Les demandes en concurrence sont posées côte à côte et
 * cerclées de rouge ; un clic ouvre la demande pour la traiter.
 */
export default function CampaignPlanning({ requests, salles, onSelect }: CampaignPlanningProps) {
  const titleId = useId();
  const salleFilterId = useId();
  const jumpId = useId();
  const [monday, setMonday] = useState(() => initialWeek(requests));
  const [selectedDay, setSelectedDay] = useState(monday);
  const [salleId, setSalleId] = useState('');
  const [showRefused, setShowRefused] = useState(false);

  const days = weekDays(monday);
  const visible = requests.filter(
    (request) =>
      request.status !== 'closed' &&
      (showRefused || request.status !== 'refused') &&
      (!salleId || String(request.salle.id) === salleId),
  );
  const columns = days.map((day) => ({
    day,
    placed: placeDay(visible.filter((request) => slotDate(request.dateDebut) === day.key)),
  }));
  const weekCount = columns.reduce((total, column) => total + column.placed.items.length, 0);
  const today = todayKey();

  const goToWeek = (day: string) => {
    setMonday(startOfWeek(day));
    setSelectedDay(day);
  };

  return (
    <section aria-labelledby={titleId} className="space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" aria-label="Semaine précédente" onClick={() => goToWeek(addDays(monday, -7))}>
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => goToWeek(today)}>
            Aujourd’hui
          </Button>
          <Button variant="secondary" size="sm" aria-label="Semaine suivante" onClick={() => goToWeek(addDays(monday, 7))}>
            <IconChevronRight className="h-4 w-4" />
          </Button>
          <div className="ml-2">
            <h3 id={titleId} className="text-body-lg font-black capitalize text-ink">
              {monthLabel(monday)}
            </h3>
            <p className="text-meta text-muted">
              {weekLabel(monday)} · {weekCount} demande{weekCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:w-auto xl:min-w-96">
          <div>
            <label htmlFor={salleFilterId} className={fieldLabelVariants()}>
              Salle
            </label>
            <select id={salleFilterId} value={salleId} onChange={(event) => setSalleId(event.target.value)} className={fieldControlVariants()}>
              <option value="">Toutes les salles</option>
              {salles.map((salle) => (
                <option key={salle.id} value={salle.id}>
                  {salle.nom}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={jumpId} className={fieldLabelVariants()}>
              Aller au
            </label>
            <input
              id={jumpId}
              type="date"
              value={selectedDay}
              onChange={(event) => event.target.value && goToWeek(event.target.value)}
              className={fieldControlVariants()}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-meta text-muted">
        <span className="flex items-center gap-2">
          <span className={legendDotVariants({ tone: 'pending' })} aria-hidden="true" />
          {CAMPAIGN_REQUEST_STATUS_LABELS.pending}
        </span>
        <span className="flex items-center gap-2">
          <span className={legendDotVariants({ tone: 'accepted' })} aria-hidden="true" />
          {CAMPAIGN_REQUEST_STATUS_LABELS.accepted}
        </span>
        <span className="flex items-center gap-2">
          <span className={legendDotVariants({ tone: 'conflict' })} aria-hidden="true" />
          Même salle, même créneau
        </span>
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-ink">
          <input type="checkbox" checked={showRefused} onChange={(event) => setShowRefused(event.target.checked)} className="accent-primary" />
          Afficher les refusées
        </label>
      </div>

      <div
        className="overflow-hidden rounded-card border border-line bg-white"
        style={{ '--planning-columns': columns.map(({ placed }) => `minmax(0, ${Math.min(placed.lanes, 3)}fr)`).join(' ') } as CSSProperties}
      >
        <div className="planning-week border-b border-line max-lg:hidden" aria-hidden="true">
          <span />
          {columns.map(({ day, placed }) => (
            <div key={day.key} className="flex flex-col items-center gap-0.5 border-l border-line py-2">
              <span className="text-label font-bold uppercase tracking-label text-muted">{day.weekday}</span>
              <span className={dayNumberVariants({ today: day.key === today })}>{day.dayNumber}</span>
              <span className="text-caption font-bold text-muted">
                {placed.items.length > 0 ? `${placed.items.length} dem.` : '—'}
              </span>
            </div>
          ))}
        </div>

        <nav aria-label="Jour affiché" className="grid grid-cols-7 gap-1 border-b border-line p-2 lg:hidden">
          {columns.map(({ day, placed }) => (
            <button
              key={day.key}
              type="button"
              aria-pressed={day.key === selectedDay}
              aria-label={`${formatDayLabel(day.key)}, ${placed.items.length} demande${placed.items.length > 1 ? 's' : ''}`}
              onClick={() => setSelectedDay(day.key)}
              className={dayTabVariants({ selected: day.key === selectedDay })}
            >
              {day.weekday}
              <span className="text-body-sm font-black">{day.dayNumber}</span>
              <span className={dayDotVariants({ visible: placed.items.length > 0, selected: day.key === selectedDay })} />
            </button>
          ))}
        </nav>

        <div className="max-h-planning-viewport overflow-y-auto custom-scrollbar">
          <div className="planning-week">
            <ol className="planning-day" style={{ '--planning-slots': PLANNING_SLOTS } as CSSProperties} aria-hidden="true">
              {PLANNING_HOURS.map((hour) => (
                <li
                  key={hour}
                  className="planning-event -translate-y-2 pr-2 text-right text-caption font-bold text-muted"
                  style={{ '--event-start': (hour - PLANNING_FIRST_HOUR) * 2 + 1, '--event-span': 2, '--event-lane': 1 } as CSSProperties}
                >
                  {hour > PLANNING_FIRST_HOUR ? `${String(hour).padStart(2, '0')}:00` : ''}
                </li>
              ))}
            </ol>

            {columns.map(({ day, placed }) => (
              <ol
                key={day.key}
                aria-label={formatDayLabel(day.key)}
                className={cn(
                  'planning-day planning-lines border-l border-line',
                  day.key !== selectedDay && 'max-lg:hidden',
                  day.key === today && 'bg-primary-soft/20',
                )}
                style={{ '--planning-slots': PLANNING_SLOTS, '--planning-lanes': placed.lanes } as CSSProperties}
              >
                {placed.items.map(({ request, start, span, lane }) => {
                  const conflict = request.conflictsWith.length > 0 && request.status !== 'refused';
                  // Plusieurs demandes côte à côte : seule l'heure de début tient sur la largeur.
                  const compact = placed.lanes > 1;
                  const hours = compact
                    ? formatSlotTime(request.dateDebut)
                    : `${formatSlotTime(request.dateDebut)} – ${formatSlotTime(request.dateFin)}`;
                  return (
                    <li key={request.id} className="contents">
                      <button
                        type="button"
                        onClick={() => onSelect(request)}
                        title={`${request.association.nom} · ${request.salle.nom} · ${formatSlotTime(request.dateDebut)} – ${formatSlotTime(request.dateFin)}`}
                        aria-label={`${request.association.nom}, ${request.salle.nom}, ${formatSlotTime(request.dateDebut)} à ${formatSlotTime(request.dateFin)}, ${CAMPAIGN_REQUEST_STATUS_LABELS[request.status]}${conflict ? ', en concurrence' : ''}`}
                        className={eventVariants({ status: request.status, conflict })}
                        style={{ '--event-start': start, '--event-span': span, '--event-lane': lane } as CSSProperties}
                      >
                        <span className="flex min-w-0 items-center gap-1 text-caption font-bold opacity-80">
                          {conflict && <IconWarning className="h-3 w-3 shrink-0" />}
                          <span className="truncate">{hours}</span>
                        </span>
                        <span className="truncate text-meta font-black">{request.association.nom}</span>
                        {span > 2 && !compact && <span className="truncate text-caption opacity-80">{request.salle.nom}</span>}
                      </button>
                    </li>
                  );
                })}
              </ol>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
