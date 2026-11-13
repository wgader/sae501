'use client';

import { useMemo, useState } from 'react';
import { OccupiedSlot, PublicRoom } from '@/lib/api';

interface RoomInteractiveCalendarProps {
  room: PublicRoom;
  occupiedSlots: OccupiedSlot[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onSelectSlot: (startHour: string, endHour: string) => void;
  isLoading?: boolean;
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// Créneaux horaires de 08:00 à 23:00 par tranches de 2 heures
const TIME_SLOTS: Array<{ start: string; end: string; label: string }> = [
  { start: '08:00', end: '10:00', label: '08h00 - 10h00' },
  { start: '10:00', end: '12:00', label: '10h00 - 12h00' },
  { start: '12:00', end: '14:00', label: '12h00 - 14h00' },
  { start: '14:00', end: '16:00', label: '14h00 - 16h00' },
  { start: '16:00', end: '18:00', label: '16h00 - 18h00' },
  { start: '18:00', end: '20:00', label: '18h00 - 20h00' },
  { start: '20:00', end: '22:00', label: '20h00 - 22h00' },
  { start: '22:00', end: '23:00', label: '22h00 - 23h00' },
];

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatDateIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function RoomInteractiveCalendar({
  room,
  occupiedSlots,
  selectedDate,
  onSelectDate,
  onSelectSlot,
  isLoading = false,
}: RoomInteractiveCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState<Date>(() => new Date(selectedDate));
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  const daysGrid = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const padding = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days: Array<Date | null> = [];
    for (let i = 0; i < padding; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [viewDate]);

  const handlePrevMonth = () => {
    const next = new Date(viewDate);
    next.setMonth(next.getMonth() - 1);
    setViewDate(next);
  };

  const handleNextMonth = () => {
    const next = new Date(viewDate);
    next.setMonth(next.getMonth() + 1);
    setViewDate(next);
  };

  // Créneaux horaires pour le jour sélectionné
  const daySlotsState = useMemo(() => {
    const dateStr = formatDateIso(selectedDate);
    const now = new Date();

    return TIME_SLOTS.map((slot) => {
      const slotStart = new Date(`${dateStr}T${slot.start}:00`);
      const slotEnd = new Date(`${dateStr}T${slot.end}:00`);

      const isPast = slotEnd.getTime() <= now.getTime();

      // Vérifie si le créneau chevauche une réservation occupée
      const conflict = occupiedSlots.find((occ) => {
        const occStart = new Date(occ.start);
        const occEnd = new Date(occ.end);
        return occStart < slotEnd && occEnd > slotStart;
      });

      const isPreReserved = conflict?.isPreReserved ?? false;
      const isReserved = !!conflict && !isPreReserved;

      return {
        ...slot,
        isPast,
        isOccupied: !!conflict,
        isPreReserved,
        isReserved,
        statusLabel: isPreReserved
          ? 'Pré-réservé'
          : isReserved
            ? 'Réservé'
            : isPast
              ? 'Passé'
              : 'Disponible',
      };
    });
  }, [selectedDate, occupiedSlots]);

  // Nombre de réservations sur le jour
  const getOccupiedCountForDay = (d: Date): number => {
    const dayStr = formatDateIso(d);
    const dayStart = new Date(`${dayStr}T00:00:00`);
    const dayEnd = new Date(`${dayStr}T23:59:59`);

    return occupiedSlots.filter((occ) => {
      const s = new Date(occ.start);
      const e = new Date(occ.end);
      return s < dayEnd && e > dayStart;
    }).length;
  };

  const selectedDateLabel = useMemo(() => {
    return `${selectedDate.getDate()} ${MONTH_NAMES[selectedDate.getMonth()].toLowerCase()} ${selectedDate.getFullYear()}`;
  }, [selectedDate]);

  return (
    <section aria-labelledby="calendar-heading" className="rounded-2xl border border-line bg-white p-6 shadow-xs">
      <header className="flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="calendar-heading" className="text-xl font-black tracking-tight text-ink">
            Planning & Disponibilités
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {room.nom} · Ouverture de {room.horairesOuverture?.debut ?? '08:00'} à {room.horairesOuverture?.fin ?? '23:00'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-paper text-ink transition-colors hover:border-primary hover:bg-white cursor-pointer"
            aria-label="Mois précédent"
          >
            ←
          </button>
          <span className="min-w-36 text-center text-sm font-bold text-ink">
            {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-paper text-ink transition-colors hover:border-primary hover:bg-white cursor-pointer"
            aria-label="Mois suivant"
          >
            →
          </button>
        </div>
      </header>

      {/* Légende */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-caption text-muted">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-xs border border-accent bg-accent/40" />
          <span>Créneau libre réservable</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-xs border border-amber-400 bg-amber-100" />
          <span>Pré-réservé (en cours mairie)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-xs border border-red-400 bg-red-100" />
          <span>Occupé / Validé</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-xs border border-line bg-paper" />
          <span>Passé / Fermé</span>
        </div>
      </div>

      {/* Grille du mois */}
      <div className="mt-5 overflow-hidden rounded-xl border border-line">
        <div className="grid grid-cols-7 border-b border-line bg-paper text-center text-caption font-bold uppercase tracking-wider text-muted">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="py-2.5">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 divide-x divide-y divide-line/60 bg-white">
          {daysGrid.map((dateObj, idx) => {
            if (!dateObj) {
              return <div key={`empty-${idx}`} className="h-16 bg-paper/40" />;
            }

            const isSelected = isSameDay(dateObj, selectedDate);
            const isToday = isSameDay(dateObj, today);
            const dateObjEnd = new Date(dateObj);
            dateObjEnd.setHours(23, 59, 59, 999);
            const isPast = dateObjEnd.getTime() < today.getTime();
            const occupiedCount = getOccupiedCountForDay(dateObj);

            return (
              <button
                key={dateObj.toISOString()}
                type="button"
                onClick={() => {
                  if (!isPast) onSelectDate(dateObj);
                }}
                disabled={isPast}
                className={`relative flex h-16 flex-col justify-between p-2 text-left transition-colors cursor-pointer ${
                  isPast
                    ? 'cursor-not-allowed bg-paper/60 text-muted/60 opacity-60'
                    : isSelected
                      ? 'bg-primary-soft ring-2 ring-primary ring-inset'
                      : 'hover:bg-primary-soft/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isSelected
                        ? 'bg-primary text-white'
                        : isToday
                          ? 'border border-ink bg-ink text-white'
                          : 'text-ink'
                    }`}
                  >
                    {dateObj.getDate()}
                  </span>

                  {occupiedCount > 0 && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                      {occupiedCount} res.
                    </span>
                  )}
                </div>

                {!isPast && (
                  <span className="text-[10px] text-muted">
                    {occupiedCount === 0 ? 'Libre' : `${occupiedCount} créneau(x)`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grille des créneaux horaires pour le jour sélectionné */}
      <div className="mt-6 border-t border-line pt-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-bold text-ink">
            Créneaux horaires du {selectedDateLabel}
          </h3>
          <p className="text-caption text-muted">
            Cliquez sur une plage libre pour pré-remplir le formulaire de réservation
          </p>
        </div>

        {isLoading ? (
          <div className="mt-4 flex items-center justify-center p-8 text-sm text-muted">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
            Chargement des disponibilités...
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {daySlotsState.map((slot, index) => {
              const isFree = !slot.isPast && !slot.isOccupied;
              const slotId = `slot-${index}`;

              // Message d'infobulle pour Scénario 2
              let tooltipText = 'Créneau libre et réservable';
              if (slot.isPast) {
                tooltipText = 'Ce créneau horaire est passé et n’est plus disponible.';
              } else if (slot.isPreReserved) {
                tooltipText = 'Ce créneau est temporairement pré-réservé (en attente de validation par la mairie).';
              } else if (slot.isReserved) {
                tooltipText = 'Ce créneau est déjà validé et occupé par une autre association.';
              }

              return (
                <div
                  key={slot.label}
                  className="relative"
                  onMouseEnter={() => setHoveredTooltip(slotId)}
                  onMouseLeave={() => setHoveredTooltip(null)}
                >
                  <button
                    type="button"
                    disabled={!isFree}
                    onClick={() => {
                      if (isFree) {
                        onSelectSlot(slot.start, slot.end);
                      }
                    }}
                    aria-describedby={hoveredTooltip === slotId ? `tooltip-${slotId}` : undefined}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                      isFree
                        ? 'border-accent bg-accent/20 hover:border-primary hover:bg-accent/40 cursor-pointer shadow-xs active:scale-98'
                        : slot.isPreReserved
                          ? 'cursor-not-allowed border-amber-300 bg-amber-50 text-amber-900 opacity-90'
                          : slot.isReserved
                            ? 'cursor-not-allowed border-red-300 bg-red-50 text-red-900 opacity-90'
                            : 'cursor-not-allowed border-line bg-paper text-muted opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">
                        {slot.label}
                      </span>
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          isFree
                            ? 'bg-emerald-500'
                            : slot.isPreReserved
                              ? 'bg-amber-500'
                              : slot.isReserved
                                ? 'bg-red-500'
                                : 'bg-muted/40'
                        }`}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-caption">
                      <span
                        className={`font-semibold ${
                          isFree
                            ? 'text-emerald-700'
                            : slot.isPreReserved
                              ? 'text-amber-800'
                              : slot.isReserved
                                ? 'text-red-800'
                                : 'text-muted'
                        }`}
                      >
                        {slot.statusLabel}
                      </span>

                      {isFree && (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                          Choisir →
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Scénario 2 : Infobulle explicative quand non disponible */}
                  {!isFree && hoveredTooltip === slotId && (
                    <div
                      id={`tooltip-${slotId}`}
                      role="tooltip"
                      className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-md bg-ink p-2 text-center text-caption font-normal text-white shadow-lg pointer-events-none animate-in fade-in zoom-in-95"
                    >
                      <p>{tooltipText}</p>
                      <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-ink" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

