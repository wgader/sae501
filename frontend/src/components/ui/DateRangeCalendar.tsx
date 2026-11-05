'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { IconChevronLeft, IconChevronRight } from '@/components/ui/icons';

const monthNames = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export type DateRangeValue = {
  start: string;
  end: string;
};

export type DateRangeCalendarProps = {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  minDate?: string;
  disabledDates?: (date: string) => boolean;
  label?: string;
  className?: string;
};

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromDateKey(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isBefore(first: string, second: string): boolean {
  return first < second;
}

function isBetween(value: string, start: string, end: string): boolean {
  return Boolean(start && end && value > start && value < end);
}

function getInitialMonth(value: DateRangeValue, minDate?: string): Date {
  return startOfMonth(fromDateKey(value.start) ?? fromDateKey(minDate ?? '') ?? new Date());
}

export default function DateRangeCalendar({
  value,
  onChange,
  minDate,
  disabledDates,
  label = 'Sélectionnez une période',
  className,
}: DateRangeCalendarProps) {
  const [viewDate, setViewDate] = useState(() => getInitialMonth(value, minDate));
  const days = useMemo(() => {
    const firstDay = startOfMonth(viewDate);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const firstCell = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1 - mondayOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstCell);
      date.setDate(firstCell.getDate() + index);
      return date;
    });
  }, [viewDate]);

  function selectDate(date: Date) {
    const selected = toDateKey(date);
    if (minDate && isBefore(selected, minDate)) return;
    if (disabledDates?.(selected)) return;

    if (!value.start || (value.start && value.end)) {
      onChange({ start: selected, end: '' });
      return;
    }

    if (isBefore(selected, value.start)) {
      onChange({ start: selected, end: value.start });
      return;
    }

    onChange({ start: value.start, end: selected });
  }

  function changeMonth(offset: number) {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <section className={cn('rounded-panel-soft bg-primary-soft p-5', className)} aria-label="Calendrier de réservation">
      <header className="flex items-center justify-between">
        <p className="text-sm font-bold text-muted">{label}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="rounded-pill p-2 text-ink transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="Mois précédent"
          >
            <IconChevronLeft />
          </button>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="rounded-pill p-2 text-ink transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="Mois suivant"
          >
            <IconChevronRight />
          </button>
        </div>
      </header>

      <div className="mt-3 flex items-center justify-between">
        <h3 className="text-lg font-black uppercase tracking-label text-ink">
          {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
        </h3>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-1" role="grid" aria-label="Choix des dates">
        {weekDays.map((day) => (
          <span key={day} className="py-1 text-center text-caption font-bold uppercase text-muted" role="columnheader">
            {day}
          </span>
        ))}
        {days.map((date) => {
          const dateKey = toDateKey(date);
          const isCurrentMonth = date.getMonth() === viewDate.getMonth();
          const isStart = dateKey === value.start;
          const isEnd = dateKey === value.end;
          const isSelected = isStart || isEnd;
          const isRangeDate = isBetween(dateKey, value.start, value.end);
          const isDisabled = Boolean(
            (minDate && isBefore(dateKey, minDate)) || disabledDates?.(dateKey),
          );

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => selectDate(date)}
              disabled={isDisabled}
              aria-label={date.toLocaleDateString('fr-FR', { dateStyle: 'full' })}
              aria-pressed={isSelected}
              className={cn(
                'relative flex h-8 items-center justify-center text-sm text-ink transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary',
                !isCurrentMonth && 'text-muted/40',
                isDisabled && 'cursor-not-allowed text-muted/30',
                !isDisabled && !isSelected && 'hover:rounded-pill hover:bg-white',
                isRangeDate && 'bg-white/60',
                isSelected && 'z-10 rounded-pill bg-primary font-bold text-white',
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </section>
  );
}
