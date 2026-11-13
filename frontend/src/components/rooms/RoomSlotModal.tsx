'use client';

import { useEffect, useMemo, useState } from 'react';
import DateRangeCalendar, { type DateRangeValue } from '@/components/ui/DateRangeCalendar';

interface RoomSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStartDate: Date;
  initialEndDate: Date;
  initialStartHour: string;
  initialEndHour: string;
  initialAttendees?: number | '';
  onValidateSlot: (
    startDate: Date,
    endDate: Date,
    startHour: string,
    endHour: string,
    attendees?: number | '',
  ) => void;
}

const TIME_OPTIONS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00',
];

function formatDateDisplay(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromDateKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function RoomSlotModal({
  isOpen,
  onClose,
  initialStartDate,
  initialEndDate,
  initialStartHour,
  initialEndHour,
  initialAttendees = '',
  onValidateSlot,
}: RoomSlotModalProps) {
  const today = useMemo(() => new Date(), []);
  const [dateRange, setDateRange] = useState<DateRangeValue>(() => ({
    start: toDateKey(initialStartDate),
    end: toDateKey(initialEndDate),
  }));
  const [startHour, setStartHour] = useState<string>(initialStartHour || '09:00');
  const [endHour, setEndHour] = useState<string>(initialEndHour || '12:00');
  const [attendees, setAttendees] = useState<number | ''>(initialAttendees);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDateRange({
      start: toDateKey(initialStartDate),
      end: toDateKey(initialEndDate),
    });
    setStartHour(initialStartHour || '09:00');
    setEndHour(initialEndHour || '12:00');
    setAttendees(initialAttendees);
    setError(null);
  }, [initialAttendees, initialEndDate, initialEndHour, initialStartDate, initialStartHour, isOpen]);

  if (!isOpen) return null;

  const handleValidate = () => {
    setError(null);
    if (!dateRange.start || !dateRange.end) {
      setError('Veuillez sélectionner une date de début et une date de fin.');
      return;
    }
    if (attendees === '' || attendees < 1) {
      setError('Veuillez renseigner le nombre de personnes.');
      return;
    }

    const startDate = fromDateKey(dateRange.start);
    const endDate = fromDateKey(dateRange.end);

    // Validation temporelle
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    const [startHours, startMinutes] = startHour.split(':').map(Number);
    const [endHours, endMinutes] = endHour.split(':').map(Number);
    startDateTime.setHours(startHours, startMinutes, 0, 0);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    if (endDateTime <= startDateTime) {
      setError('La date et l’heure de fin doivent être postérieures au début.');
      return;
    }

    const now = new Date();

    if (startDateTime.getTime() <= now.getTime()) {
      setError('Ce créneau horaire est déjà passé. Veuillez choisir une date et un horaire futurs.');
      return;
    }

    onValidateSlot(startDate, endDate, startHour, endHour, attendees);
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
            <DateRangeCalendar
              value={dateRange}
              minDate={toDateKey(today)}
              onChange={setDateRange}
              className="rounded-none bg-transparent p-0"
            />
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
                    value={dateRange.start ? formatDateDisplay(fromDateKey(dateRange.start)) : ''}
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
                    value={dateRange.end ? formatDateDisplay(fromDateKey(dateRange.end)) : ''}
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
                  required
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

