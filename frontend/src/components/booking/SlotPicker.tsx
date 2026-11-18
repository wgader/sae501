'use client';

import { useState } from 'react';
import { cva } from 'class-variance-authority';
import BookingCalendar, { type DayRange } from '@/components/rooms/booking/BookingCalendar';
import TimeOptionsPanel from '@/components/rooms/booking/TimeOptionsPanel';
import { IconChevronRight } from '@/components/ui/icons';
import {
  EMPTY_SLOT,
  formatLongDay,
  formatShortDay,
  formatTime,
  getDayState,
  getEndOptions,
  getMaxEndDay,
  getStartOptions,
  type AvailabilityContext,
  type SlotSelection,
} from '@/lib/roomAvailability';

interface SlotPickerProps {
  slot: SlotSelection;
  context: AvailabilityContext;
  onChange: (slot: SlotSelection) => void;
}

type TimeFieldName = 'start' | 'end';

const timeFieldVariants = cva(
  'flex w-full items-center justify-between gap-3 rounded-control border bg-white px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:bg-paper',
  {
    variants: {
      open: {
        true: 'border-primary ring-2 ring-primary-soft',
        false: 'cursor-pointer border-line hover:border-primary',
      },
    },
  },
);

/** Choix des jours puis des horaires, limité à ce que la salle et les règles permettent. */
export default function SlotPicker({ slot, context, onChange }: SlotPickerProps) {
  const [openField, setOpenField] = useState<TimeFieldName | null>(null);
  const { rules, today } = context;

  const changeDays = (range: DayRange) => {
    setOpenField(null);
    onChange({ ...slot, startDay: range.start, endDay: range.end });
  };

  const fields: { name: TimeFieldName; label: string; day: string | null; time: string | null }[] = [
    { name: 'start', label: 'Début', day: slot.startDay, time: slot.startTime },
    { name: 'end', label: 'Fin', day: slot.endDay, time: slot.endTime },
  ];
  const openOptions = openField === 'start' ? getStartOptions(slot, context) : getEndOptions(slot, context);

  const noTimeLeft = slot.startDay !== null && (slot.startTime === null || slot.endTime === null);

  return (
    <div className="space-y-6">
      <BookingCalendar
        value={{ start: slot.startDay, end: slot.endDay }}
        onChange={changeDays}
        firstDay={today}
        lastDay={rules.lastDay}
        getDayState={(day) => getDayState(day, context)}
        getMaxEndDay={(day) => getMaxEndDay(day, context)}
      />

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line pt-4">
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-meta text-muted">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-pill bg-ochre" />
            Partiellement réservé
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="font-bold line-through">
              15
            </span>
            Complet
          </li>
        </ul>
        {slot.startDay && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_SLOT)}
            className="cursor-pointer text-meta font-bold text-ink underline underline-offset-2 hover:text-primary"
          >
            Effacer les dates
          </button>
        )}
      </div>

      <p className="text-meta text-muted">
        {rules.maxDays} jours consécutifs maximum · réservable jusqu’au {formatLongDay(rules.lastDay)}.
      </p>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <button
              key={field.name}
              type="button"
              disabled={!slot.startDay}
              aria-expanded={openField === field.name}
              onClick={() => setOpenField(openField === field.name ? null : field.name)}
              className={timeFieldVariants({ open: openField === field.name })}
            >
              <span className="min-w-0">
                <span className="block text-label font-bold uppercase tracking-label text-muted">
                  {field.label}
                  {field.day ? ` · ${formatShortDay(field.day)}` : ''}
                </span>
                <span className="mt-0.5 block text-lg font-black tabular-nums text-ink">
                  {field.time ? formatTime(field.time) : '--h--'}
                </span>
              </span>
              <IconChevronRight className={`h-4 w-4 shrink-0 text-muted transition-transform ${openField === field.name ? '-rotate-90' : 'rotate-90'}`} />
            </button>
          ))}
        </div>

        {openField && (
          <TimeOptionsPanel
            label={openField === 'start' ? 'Heure de début' : 'Heure de fin'}
            value={openField === 'start' ? slot.startTime : slot.endTime}
            options={openOptions}
            onChange={(time) => onChange(openField === 'start' ? { ...slot, startTime: time } : { ...slot, endTime: time })}
            onDone={() => setOpenField(null)}
          />
        )}

        {noTimeLeft && (
          <p role="alert" className="text-meta font-semibold text-danger">
            Aucun horaire n’est possible sur ces dates. Choisissez d’autres jours.
          </p>
        )}
      </div>
    </div>
  );
}
