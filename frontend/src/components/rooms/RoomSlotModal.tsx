'use client';

import { useMemo, useState } from 'react';

interface RoomSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate: Date;
  initialStartHour: string;
  initialEndHour: string;
  initialAttendees?: number | '';
  onValidateSlot: (date: Date, startHour: string, endHour: string, attendees?: number | '') => void;
}

const MONTH_NAMES = [
  'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
  'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE',
];

const WEEK_DAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

const TIME_OPTIONS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00',
];

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatDateDisplay(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function RoomSlotModal({
  isOpen,
  onClose,
  initialDate,
  initialStartHour,
  initialEndHour,
  initialAttendees = '',
  onValidateSlot,
}: RoomSlotModalProps) {
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(initialDate));
  const [viewDate, setViewDate] = useState<Date>(() => new Date(initialDate));
  const [startHour, setStartHour] = useState<string>(initialStartHour || '09:00');
  const [endHour, setEndHour] = useState<string>(initialEndHour || '12:00');
  const [attendees, setAttendees] = useState<number | ''>(initialAttendees);
  const [error, setError] = useState<string | null>(null);

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

  if (!isOpen) return null;

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

  const handleValidate = () => {
    setError(null);

    // Validation temporelle
    if (endHour <= startHour) {
      setError('L’heure de fin doit être strictement postérieure à l’heure de début.');
      return;
    }

    const now = new Date();
    const selectedDateTime = new Date(selectedDate);
    const [h, m] = startHour.split(':').map(Number);
    selectedDateTime.setHours(h, m, 0, 0);

    if (selectedDateTime.getTime() <= now.getTime()) {
      setError('Ce créneau horaire est déjà passé. Veuillez choisir une date et un horaire futurs.');
      return;
    }

    onValidateSlot(selectedDate, startHour, endHour, attendees);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs animate-in fade-in"
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
            Choisissez le créneau de la réservation
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-paper hover:text-ink cursor-pointer"
            aria-label="Fermer la fenêtre"
          >
            ✕
          </button>
        </header>

        {/* Content */}
        <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-12 sm:divide-x sm:divide-y-0">
          {/* Left: Monthly Calendar */}
          <div className="p-6 sm:col-span-7">
            <div className="flex items-center justify-between pb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 text-muted transition-colors hover:text-ink cursor-pointer"
                aria-label="Mois précédent"
              >
                ←
              </button>
              <span className="text-sm font-bold uppercase tracking-wider text-ink">
                {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 text-muted transition-colors hover:text-ink cursor-pointer"
                aria-label="Mois suivant"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-caption font-bold text-muted pb-2">
              {WEEK_DAYS.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {daysGrid.map((dateObj, idx) => {
                if (!dateObj) {
                  return <div key={`pad-${idx}`} className="h-8" />;
                }

                const isSelected = isSameDay(dateObj, selectedDate);
                const isToday = isSameDay(dateObj, today);
                const dateObjEnd = new Date(dateObj);
                dateObjEnd.setHours(23, 59, 59, 999);
                const isPast = dateObjEnd.getTime() < today.getTime();

                return (
                  <button
                    key={dateObj.toISOString()}
                    type="button"
                    disabled={isPast}
                    onClick={() => {
                      if (!isPast) setSelectedDate(dateObj);
                    }}
                    className={`flex h-8 w-8 items-center justify-center mx-auto rounded-full font-bold transition-all cursor-pointer ${
                      isPast
                        ? 'cursor-not-allowed text-muted/40 opacity-40'
                        : isSelected
                          ? 'bg-primary text-white shadow-xs'
                          : isToday
                            ? 'border border-primary text-primary hover:bg-primary-soft'
                            : 'text-ink hover:bg-paper'
                    }`}
                  >
                    {dateObj.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Form controls */}
          <div className="flex flex-col justify-between p-6 sm:col-span-5 bg-paper/20">
            <div className="space-y-4">
              {/* DÉBUT */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Début
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={formatDateDisplay(selectedDate)}
                    className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink"
                  />
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="rounded-md border border-line bg-white px-2 py-1.5 text-xs font-semibold text-ink outline-none focus:border-primary"
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={`start-${time}`} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* FIN */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Fin
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={formatDateDisplay(selectedDate)}
                    className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink"
                  />
                  <select
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    className="rounded-md border border-line bg-white px-2 py-1.5 text-xs font-semibold text-ink outline-none focus:border-primary"
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={`end-${time}`} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* NOMBRE DE PERSONNES */}
              <div>
                <label htmlFor="modal-attendees" className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Nombre de personnes
                </label>
                <input
                  id="modal-attendees"
                  type="number"
                  min={1}
                  placeholder="Ex : 50"
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value ? Number(e.target.value) : '')}
                  className="mt-1 w-full rounded-md border border-line bg-white px-3 py-1.5 text-xs text-ink outline-none focus:border-primary"
                />
              </div>

              {error && (
                <p role="alert" className="rounded-md bg-red-50 p-2 text-caption font-semibold text-red-700">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-line/60">
              <button
                type="button"
                onClick={handleValidate}
                className="w-full rounded-lg bg-primary py-3 text-center text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-primary-hover cursor-pointer"
              >
                Valider le créneau →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

