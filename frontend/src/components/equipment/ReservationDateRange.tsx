'use client';

import { useMemo } from 'react';
import DateRangeCalendar, { type DateRangeValue } from '@/components/ui/DateRangeCalendar';
import FormField from '@/components/ui/FormField';

type ReservationDateRangeProps = {
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
};

function getLocalDateTimeMinimum(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localNow = new Date(now.getTime() - offset * 60_000);
  return localNow.toISOString().slice(0, 16);
}

function getDatePart(value: string): string {
  return value.slice(0, 10);
}

function getTimePart(value: string, fallback: string): string {
  return value.slice(11, 16) || fallback;
}

function mergeDateAndTime(date: string, time: string): string {
  return date ? `${date}T${time}` : '';
}

export default function ReservationDateRange({
  start,
  end,
  onStartChange,
  onEndChange,
}: ReservationDateRangeProps) {
  const minimum = useMemo(() => getLocalDateTimeMinimum(), []);
  const minimumDate = minimum.slice(0, 10);
  const startTime = getTimePart(start, minimumDate === getDatePart(start) ? minimum.slice(11, 16) : '09:00');
  const endTime = getTimePart(end, '18:00');
  const range: DateRangeValue = {
    start: getDatePart(start),
    end: getDatePart(end),
  };
  const startDateTime = mergeDateAndTime(range.start, startTime);
  const endDateTime = mergeDateAndTime(range.end, endTime);
  const error =
    startDateTime !== '' && startDateTime < minimum
      ? 'La date de retrait ne peut pas être passée.'
      : endDateTime !== '' && startDateTime !== '' && endDateTime <= startDateTime
        ? 'La restitution doit être postérieure au retrait.'
        : '';

  return (
    <fieldset className="space-y-4">
      <legend className="text-xs font-bold uppercase tracking-label text-ink">
        Période de réservation
      </legend>
      <DateRangeCalendar
        value={range}
        minDate={minimumDate}
        onChange={(nextRange) => {
          const defaultStartTime = nextRange.start === minimumDate ? minimum.slice(11, 16) : '09:00';
          onStartChange(mergeDateAndTime(nextRange.start, getTimePart(start, defaultStartTime)));
          onEndChange(mergeDateAndTime(nextRange.end, getTimePart(end, '18:00')));
        }}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Heure de retrait"
          name="reservation-start-time"
          type="time"
          labelClassName="whitespace-nowrap"
          min={range.start === minimumDate ? minimum.slice(11, 16) : undefined}
          value={startTime}
          onChange={(event) => onStartChange(mergeDateAndTime(range.start, event.target.value))}
          error={startDateTime !== '' && startDateTime < minimum ? 'L’heure de retrait ne peut pas être passée.' : undefined}
          required
        />
        <FormField
          label="Heure de restitution"
          name="reservation-end-time"
          type="time"
          labelClassName="whitespace-nowrap"
          min={range.start === range.end ? startTime : undefined}
          value={endTime}
          onChange={(event) => onEndChange(mergeDateAndTime(range.end, event.target.value))}
          error={endDateTime !== '' && startDateTime !== '' && endDateTime <= startDateTime
            ? 'La restitution doit être postérieure au retrait.'
            : undefined}
          required
        />
      </div>
      {error && !start && !end && (
        <p className="text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
