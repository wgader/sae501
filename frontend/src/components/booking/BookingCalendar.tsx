'use client';

import { useState } from 'react';
import { cva } from 'class-variance-authority';
import { IconChevronLeft, IconChevronRight } from '@/components/ui/icons';
import { formatLongDay, type DayState } from '@/lib/bookingAvailability';

export interface DayRange {
  start: string | null;
  end: string | null;
}

interface BookingCalendarProps {
  value: DayRange;
  onChange: (range: DayRange) => void;
  firstDay: string;
  lastDay: string;
  getDayState: (day: string) => DayState;
  /** Dernier jour de fin possible depuis un jour de début. */
  getMaxEndDay: (startDay: string) => string;
  /** Libellé lu par les lecteurs d'écran pour un jour entamé. */
  partialLabel?: string;
  recurrenceFrequency?: string;
  recurrenceStart?: string | null;
  singleMonth?: boolean;
  singleSelection?: boolean;
}

const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const STATE_LABELS: Record<DayState, string> = {
  free: 'disponible',
  partial: 'partiellement réservé',
  full: 'complet',
  blocked: 'réservé à la campagne',
  unavailable: 'indisponible',
};

const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

const bandVariants = cva('flex justify-center', {
  variants: {
    band: {
      none: '',
      middle: 'bg-primary-soft',
      start: 'rounded-l-pill bg-primary-soft',
      end: 'rounded-r-pill bg-primary-soft',
    },
  },
});

const dayVariants = cva(
  'relative flex h-10 w-10 items-center justify-center rounded-pill text-body-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
  {
    variants: {
      tone: {
        selected: 'cursor-pointer bg-primary text-white',
        available: 'cursor-pointer text-ink hover:bg-white hover:ring-2 hover:ring-primary',
        recurring: 'cursor-pointer bg-primary-soft text-primary ring-1 ring-primary',
        beyondLimit: 'cursor-pointer text-muted/50 hover:bg-paper',
        struck: 'cursor-not-allowed text-muted/50 line-through',
        past: 'cursor-not-allowed text-muted/30',
      },
    },
  },
);

function shiftMonth(month: string, amount: number): string {
  const [year, value] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, value - 1 + amount, 1));
  return date.toISOString().slice(0, 7);
}

function monthCells(month: string): (string | null)[] {
  const [year, value] = month.split('-').map(Number);
  const firstWeekDay = (new Date(Date.UTC(year, value - 1, 1)).getUTCDay() + 6) % 7;
  const dayCount = new Date(Date.UTC(year, value, 0)).getUTCDate();
  const days = Array.from({ length: dayCount }, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`);
  return [...Array<null>(firstWeekDay).fill(null), ...days];
}

function monthTitle(month: string): string {
  return monthFormatter.format(new Date(`${month}-01T12:00:00Z`));
}

/** Calendrier de réservation : plage de jours, jours complets barrés, durée maximale respectée. */
export default function BookingCalendar({
  value,
  onChange,
  firstDay,
  lastDay,
  getDayState,
  getMaxEndDay,
  partialLabel = STATE_LABELS.partial,
  recurrenceFrequency,
  recurrenceStart,
  singleMonth = false,
  singleSelection = false,
}: BookingCalendarProps) {
  const firstMonth = firstDay.slice(0, 7);
  const lastMonth = lastDay.slice(0, 7);
  const [month, setMonth] = useState((value.start ?? firstDay).slice(0, 7));
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const isChoosingEnd = value.start !== null && value.start === value.end;
  const maxEnd = isChoosingEnd && value.start ? getMaxEndDay(value.start) : null;
  const previewEnd = isChoosingEnd && maxEnd && hoveredDay && hoveredDay > (value.start ?? '') && hoveredDay <= maxEnd
    ? hoveredDay
    : value.end;
  const months = !singleMonth && month < lastMonth ? [month, shiftMonth(month, 1)] : [month];

  const pick = (day: string) => {
    if (singleSelection) {
      onChange({ start: day, end: day });
      return;
    }
    if (isChoosingEnd && maxEnd && value.start && day > value.start && day <= maxEnd) {
      onChange({ start: value.start, end: day });
      return;
    }
    onChange({ start: day, end: day });
  };

  const isRecurringOccurrence = (day: string) => {
    if (!recurrenceStart || !recurrenceFrequency || day < recurrenceStart) return false;
    const start = new Date(`${recurrenceStart}T12:00:00Z`);
    const current = new Date(`${day}T12:00:00Z`);
    if (recurrenceFrequency === 'daily') return true;
    if (recurrenceFrequency === 'weekly') return current.getUTCDay() === start.getUTCDay();
    if (recurrenceFrequency === 'biweekly') {
      const elapsedDays = Math.round((current.getTime() - start.getTime()) / 86_400_000);
      return elapsedDays >= 0 && elapsedDays % 14 === 0;
    }
    if (recurrenceFrequency === 'monthly') return day.slice(8) === recurrenceStart.slice(8);
    return false;
  };

  const renderDay = (day: string) => {
    const state = getDayState(day);
    const isEdge = day === value.start || day === value.end;
    const isInRange = value.start !== null && previewEnd !== null && day >= value.start && day <= previewEnd;
    const hasRange = value.start !== null && previewEnd !== null && value.start !== previewEnd;

    let band: 'none' | 'middle' | 'start' | 'end' = 'none';
    if (hasRange && isInRange) {
      if (day === value.start) band = 'start';
      else if (day === previewEnd) band = 'end';
      else band = 'middle';
    }

    let tone: 'selected' | 'available' | 'recurring' | 'beyondLimit' | 'struck' | 'past' = 'available';
    if (isEdge) tone = 'selected';
    else if (isRecurringOccurrence(day)) tone = 'recurring';
    else if (state === 'full' || state === 'blocked') tone = 'struck';
    else if (state === 'unavailable') tone = 'past';
    else if (maxEnd && value.start && day > maxEnd) tone = 'beyondLimit';

    const isDisabled = state === 'full' || state === 'blocked' || state === 'unavailable';
    const stateLabel = state === 'partial' ? partialLabel : STATE_LABELS[state];

    return (
      <div key={day} className={bandVariants({ band })}>
        <button
          type="button"
          disabled={isDisabled}
          aria-pressed={isEdge}
          aria-label={`${formatLongDay(day)}, ${stateLabel}`}
          title={stateLabel}
          onClick={() => pick(day)}
          onMouseEnter={() => setHoveredDay(day)}
          onMouseLeave={() => setHoveredDay(null)}
          className={dayVariants({ tone })}
        >
          {Number(day.slice(8))}
          {state === 'partial' && (
            <span aria-hidden="true" className={`absolute bottom-1 h-1 w-1 rounded-pill ${isEdge ? 'bg-white' : 'bg-ochre'}`} />
          )}
        </button>
      </div>
    );
  };

  const navButtonClassName =
    'absolute top-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-pill border border-line bg-white text-ink transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-30';

  return (
    <div className="@container relative">
      <button
        type="button"
        aria-label="Mois précédent"
        disabled={month <= firstMonth}
        onClick={() => setMonth(shiftMonth(month, -1))}
        className={`${navButtonClassName} left-0`}
      >
        <IconChevronLeft />
      </button>
      <button
        type="button"
        aria-label="Mois suivant"
        disabled={month >= lastMonth}
        onClick={() => setMonth(shiftMonth(month, 1))}
        className={`${navButtonClassName} right-0`}
      >
        <IconChevronRight />
      </button>

      <div className="grid gap-8 @xl:grid-cols-2">
        {months.map((current, index) => (
          <section key={current} aria-label={monthTitle(current)} className={index > 0 ? 'hidden @xl:block' : undefined}>
            <h3 className="flex h-9 items-center justify-center text-body-sm font-black text-ink first-letter:uppercase">
              {monthTitle(current)}
            </h3>
            <div aria-hidden="true" className="mt-3 grid grid-cols-7 text-center text-caption font-bold text-muted">
              {WEEK_DAYS.map((label, position) => (
                <span key={`${label}-${position}`}>{label}</span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-y-1">
              {monthCells(current).map((day, position) => (day ? renderDay(day) : <span key={`empty-${position}`} />))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
