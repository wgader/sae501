'use client';

import { useId, useState, type CSSProperties } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { IconChevronLeft, IconChevronRight, IconWarning } from '@/components/ui/icons';
import CampaignRequestStatusBadge, { CAMPAIGN_REQUEST_STATUS_LABELS } from '@/components/admin/campaign/CampaignRequestStatusBadge';
import Dialog from '@/components/ui/Dialog';
import { formatDayLabel, formatSlotTime, slotDate } from '@/lib/campaignDates';
import {
  PLANNING_FIRST_HOUR,
  PLANNING_HOURS,
  PLANNING_SLOTS,
  addDays,
  collapseLanes,
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
  /** Premier jour réservable de la campagne (AAAA-MM-JJ). */
  periodStart: string | null;
  salles: Option[];
  onSelect: (request: CampaignRequest) => void;
}

/** Contrôles de la barre d'outils : tous à la même hauteur que les boutons « sm ». */
const toolbarControlVariants = cva(
  'inline-flex h-9 items-center justify-center rounded-control border border-line bg-white text-meta font-bold text-ink transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft cursor-pointer',
  {
    variants: {
      shape: {
        text: 'px-3 uppercase tracking-label',
        icon: 'w-9',
        field: 'px-3 font-semibold normal-case',
      },
    },
    defaultVariants: { shape: 'text' },
  },
);

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
export default function CampaignPlanning({ requests, periodStart, salles, onSelect }: CampaignPlanningProps) {
  const titleId = useId();
  const salleFilterId = useId();
  const jumpId = useId();
  const [monday, setMonday] = useState(() => initialWeek(requests, periodStart));
  const [selectedDay, setSelectedDay] = useState(monday);
  const [salleId, setSalleId] = useState('');
  const [showRefused, setShowRefused] = useState(false);
  const [overflowList, setOverflowList] = useState<CampaignRequest[] | null>(null);

  const days = weekDays(monday);
  const visible = requests.filter(
    (request) =>
      request.status !== 'closed' &&
      (showRefused || request.status !== 'refused') &&
      (!salleId || String(request.salle.id) === salleId),
  );
  const columns = days.map((day) => {
    const placed = placeDay(visible.filter((request) => slotDate(request.dateDebut) === day.key));
    return { day, placed, shown: collapseLanes(placed) };
  });
  const weekCount = columns.reduce((total, column) => total + column.placed.items.length, 0);
  const today = todayKey();

  const goToWeek = (day: string) => {
    setMonday(startOfWeek(day));
    setSelectedDay(day);
  };

  return (
    <section aria-labelledby={titleId} className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Semaine précédente" onClick={() => goToWeek(addDays(monday, -7))} className={toolbarControlVariants({ shape: 'icon' })}>
              <IconChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Semaine suivante" onClick={() => goToWeek(addDays(monday, 7))} className={toolbarControlVariants({ shape: 'icon' })}>
              <IconChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="min-w-0">
            <h3 id={titleId} className="text-body-lg font-black capitalize leading-tight text-ink">
              {monthLabel(monday)}
            </h3>
            <p className="text-meta text-muted">
              {weekLabel(monday)} · {weekCount} demande{weekCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {periodStart && (
            <button type="button" onClick={() => goToWeek(periodStart)} className={toolbarControlVariants()}>
              Début de campagne
            </button>
          )}
          <button type="button" onClick={() => goToWeek(today)} className={toolbarControlVariants()}>
            Aujourd’hui
          </button>
          <label htmlFor={salleFilterId} className="sr-only">
            Salle
          </label>
          <select id={salleFilterId} value={salleId} onChange={(event) => setSalleId(event.target.value)} className={toolbarControlVariants({ shape: 'field' })}>
            <option value="">Toutes les salles</option>
            {salles.map((salle) => (
              <option key={salle.id} value={salle.id}>
                {salle.nom}
              </option>
            ))}
          </select>
          <label htmlFor={jumpId} className="sr-only">
            Aller au
          </label>
          <input
            id={jumpId}
            type="date"
            value={selectedDay}
            onChange={(event) => event.target.value && goToWeek(event.target.value)}
            className={toolbarControlVariants({ shape: 'field' })}
          />
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
          En conflit (même salle, même créneau)
        </span>
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-ink">
          <input type="checkbox" checked={showRefused} onChange={(event) => setShowRefused(event.target.checked)} className="accent-primary" />
          Afficher les refusées
        </label>
      </div>

      <div
        className="overflow-hidden rounded-card border border-line bg-white"
        style={{ '--planning-columns': columns.map(({ shown }) => `minmax(0, ${shown.lanes}fr)`).join(' ') } as CSSProperties}
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

            {columns.map(({ day, shown }) => (
              <ol
                key={day.key}
                aria-label={formatDayLabel(day.key)}
                className={cn(
                  'planning-day planning-lines border-l border-line',
                  day.key !== selectedDay && 'max-lg:hidden',
                  day.key === today && 'bg-primary-soft/20',
                )}
                style={{ '--planning-slots': PLANNING_SLOTS, '--planning-lanes': shown.lanes } as CSSProperties}
              >
                {shown.overflow.map((chip) => (
                  <li key={chip.key} className="contents">
                    <button
                      type="button"
                      onClick={() => setOverflowList(chip.requests)}
                      aria-label={`${chip.requests.length} autres demandes sur ce créneau, afficher la liste`}
                      className="planning-event m-0.5 flex min-w-0 flex-col items-center justify-center rounded-control bg-ink text-white ring-2 ring-danger transition-colors hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-primary cursor-pointer"
                      style={{ '--event-start': chip.start, '--event-span': chip.span, '--event-lane': chip.lane } as CSSProperties}
                    >
                      <span className="text-body-sm font-black">+{chip.requests.length}</span>
                      <span className="text-caption font-bold opacity-80">voir</span>
                    </button>
                  </li>
                ))}
                {shown.items.map(({ request, start, span, lane }) => {
                  const conflict = request.conflictsWith.length > 0 && request.status !== 'refused';
                  // Plusieurs demandes côte à côte : seule l'heure de début tient sur la largeur.
                  const compact = shown.lanes > 1;
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

      <Dialog
        open={overflowList !== null}
        title={`${overflowList?.length ?? 0} autres demandes sur ce créneau`}
        description="Toutes visent la même plage horaire : ouvrez une demande pour la traiter."
        onClose={() => setOverflowList(null)}
      >
        <ul className="max-h-planning-viewport divide-y divide-line overflow-y-auto custom-scrollbar">
          {(overflowList ?? []).map((request) => (
            <li key={request.id}>
              <button
                type="button"
                onClick={() => {
                  setOverflowList(null);
                  onSelect(request);
                }}
                className="flex w-full cursor-pointer items-center justify-between gap-3 px-1 py-3 text-left hover:bg-paper"
              >
                <span className="min-w-0">
                  <span className="block truncate text-body-sm font-black text-ink">{request.association.nom}</span>
                  <span className="block truncate text-meta text-muted">
                    {request.salle.nom} · {formatSlotTime(request.dateDebut)} – {formatSlotTime(request.dateFin)}
                  </span>
                </span>
                <CampaignRequestStatusBadge status={request.status} conflict={request.conflictsWith.length > 0} className="shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      </Dialog>
    </section>
  );
}
