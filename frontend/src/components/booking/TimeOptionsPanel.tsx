'use client';

import { cva } from 'class-variance-authority';
import type { TimeOption } from '@/lib/roomAvailability';

interface TimeOptionsPanelProps {
  label: string;
  value: string | null;
  options: TimeOption[];
  onChange: (time: string) => void;
  onDone: () => void;
}

const chipVariants = cva(
  'flex h-9 items-center justify-center rounded-control text-meta font-bold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
  {
    variants: {
      state: {
        selected: 'cursor-pointer bg-primary text-white',
        available: 'cursor-pointer bg-white text-ink ring-1 ring-inset ring-line hover:ring-2 hover:ring-primary',
        disabled: 'cursor-not-allowed bg-paper text-muted/40 line-through',
      },
    },
  },
);

/** Choix de l'heure puis des minutes, par tranches de dix minutes. */
export default function TimeOptionsPanel({ label, value, options, onChange, onDone }: TimeOptionsPanelProps) {
  const selectedHour = value?.slice(0, 2) ?? null;
  const selectedMinute = value?.slice(3) ?? null;
  const isFree = (time: string) => options.some((option) => option.value === time && !option.disabled);

  const hours = [...new Set(options.map((option) => option.value.slice(0, 2)))];
  const minutes = [...new Set(options.map((option) => option.value.slice(3)))].sort();
  const hourIsFree = (hour: string) => options.some((option) => option.value.startsWith(`${hour}:`) && !option.disabled);

  const pickHour = (hour: string) => {
    const sameMinute = `${hour}:${selectedMinute ?? '00'}`;
    const firstFree = options.find((option) => option.value.startsWith(`${hour}:`) && !option.disabled)?.value;
    const next = isFree(sameMinute) ? sameMinute : firstFree;
    if (next) onChange(next);
  };

  const pickMinute = (minute: string) => {
    if (!selectedHour) return;
    onChange(`${selectedHour}:${minute}`);
    onDone();
  };

  const chipState = (isSelected: boolean, isAvailable: boolean) => {
    if (isSelected) return 'selected';
    return isAvailable ? 'available' : 'disabled';
  };

  return (
    <div role="group" aria-label={label} className="space-y-4 rounded-soft bg-paper p-4">
      <fieldset>
        <legend className="text-label font-bold uppercase tracking-label text-muted">Heure</legend>
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {hours.map((hour) => (
            <button
              key={hour}
              type="button"
              disabled={!hourIsFree(hour)}
              aria-pressed={hour === selectedHour}
              onClick={() => pickHour(hour)}
              className={chipVariants({ state: chipState(hour === selectedHour, hourIsFree(hour)) })}
            >
              {hour}h
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-label font-bold uppercase tracking-label text-muted">Minutes</legend>
        <div className="mt-2 grid grid-cols-6 gap-2">
          {minutes.map((minute) => {
            const isAvailable = selectedHour !== null && isFree(`${selectedHour}:${minute}`);
            return (
              <button
                key={minute}
                type="button"
                disabled={!isAvailable}
                aria-pressed={minute === selectedMinute}
                onClick={() => pickMinute(minute)}
                className={chipVariants({ state: chipState(minute === selectedMinute, isAvailable) })}
              >
                {minute}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
