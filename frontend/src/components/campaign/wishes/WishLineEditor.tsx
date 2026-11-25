'use client';

import { useId, useMemo, useState, type ReactNode } from 'react';
import { fieldControlVariants, fieldHintVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';
import { IconChevronRight, IconTrash } from '@/components/ui/icons';
import type { PublicRoom, RoomBookingRules } from '@/lib/api';
import BookingCalendar from '@/components/booking/BookingCalendar';
import TimeOptionsPanel from '@/components/booking/TimeOptionsPanel';
import RoomCatalogCard from '@/components/rooms/RoomCatalogCard';
import {
  EMPTY_SLOT,
  formatShortDay,
  formatTime,
  getDayState,
  getEndOptions,
  getMaxEndDay,
  getStartOptions,
  isSlotComplete,
  normalizeSlot,
  readBookingClock,
  type AvailabilityContext,
  type SlotSelection,
} from '@/lib/bookingAvailability';
import { WISH_FREQUENCIES, type WishDraft, type WishErrors, type WishField } from '@/lib/campaignWishes';

interface WishLineEditorProps {
  index: number;
  wish: WishDraft;
  rooms: PublicRoom[];
  errors: WishErrors;
  /** Ce vœu chevauche un autre vœu du dossier. */
  overlaps: boolean;
  showErrors: boolean;
  canRemove: boolean;
  periodStart: string | null;
  periodEnd: string | null;
  roomRules: RoomBookingRules | null;
  onChange: (field: WishField, value: string) => void;
  onRemove: () => void;
}

/** Un vœu récurrent : salle, jour, horaires, fréquence, activité, public et effectif. */
export default function WishLineEditor({
  index,
  wish,
  rooms,
  errors,
  overlaps,
  showErrors,
  canRemove,
  periodStart,
  periodEnd,
  roomRules,
  onChange,
  onRemove,
}: WishLineEditorProps) {
  const baseId = useId();
  const [clock] = useState(readBookingClock);
  const [rawSlot, setRawSlot] = useState<SlotSelection>({
    startDay: wish.startDate || periodStart,
    endDay: wish.startDate || periodStart,
    startTime: wish.startTime,
    endTime: wish.endTime,
  });
  const [frequency, setFrequency] = useState(wish.frequency || 'weekly');
  const [openTimeField, setOpenTimeField] = useState<'start' | 'end' | null>(null);
  const visible = (field: WishField) => (showErrors || field === 'endTime' ? errors[field] : undefined);

  const field = (name: WishField, label: string, control: (id: string, invalid: boolean) => ReactNode, wide = false) => {
    const id = `${baseId}-${name}`;
    const error = visible(name);
    return (
      <div className={wide ? 'sm:col-span-2 lg:col-span-4' : undefined}>
        <label htmlFor={id} className={fieldLabelVariants()}>{label}</label>
        {control(id, Boolean(error))}
        {error && <p id={`${id}-error`} className={fieldHintVariants({ tone: 'danger' })}>{error}</p>}
      </div>
    );
  };

  /** Attributs communs à chaque champ : valeur, erreur annoncée et style. */
  const control = (name: WishField, id: string, invalid: boolean) => ({
    id,
    value: wish[name],
    'aria-invalid': invalid,
    'aria-describedby': invalid ? `${id}-error` : undefined,
    onChange: (event: { target: { value: string } }) => onChange(name, event.target.value),
    className: fieldControlVariants({ invalid }),
  });

  const context = useMemo<AvailabilityContext | null>(() => {
    if (!roomRules) return null;
    const rules = {
      ...roomRules,
      lastDay: periodEnd ?? roomRules.lastDay,
    };
    return {
      rules,
      busy: [],
      ...clock,
      today: periodStart && periodStart > clock.today ? periodStart : clock.today,
    };
  }, [roomRules, periodEnd, periodStart, clock]);
  const slot = useMemo(
    () => (context ? normalizeSlot(rawSlot, context) : EMPTY_SLOT),
    [rawSlot, context],
  );

  return (
    <fieldset className={`rounded-card border bg-white p-5 sm:p-6 ${overlaps ? 'border-danger' : 'border-line'}`}>
      <legend className="sr-only">Vœu {index + 1}</legend>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-body font-black text-ink" aria-hidden="true">Vœu {index + 1}</p>
        {canRemove && (
          <button type="button" onClick={onRemove} className="inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-meta font-bold text-muted transition-colors hover:bg-danger/10 hover:text-danger cursor-pointer">
            <IconTrash className="h-4 w-4" />
            Retirer
          </button>
        )}
      </div>
      {overlaps && (
        <p className="mb-4 rounded-soft bg-danger/10 px-3 py-2 text-meta font-semibold text-danger">
          Ce vœu chevauche un autre vœu de votre dossier (même salle, même jour).
        </p>
      )}
      {context && (
        <section aria-labelledby={`${baseId}-slot-title`} className="grid gap-6 lg:grid-cols-12">
          <h3 id={`${baseId}-slot-title`} className="sr-only">Vos dates et horaires</h3>
          <div className="lg:col-span-7">
            <BookingCalendar
              value={{ start: slot.startDay, end: slot.endDay }}
              onChange={(range) => {
                const next = { ...slot, startDay: range.start, endDay: range.end };
                setRawSlot(next);
                if (range.start) {
                  onChange('startDate', range.start);
                  onChange('dayOfWeek', String(((new Date(`${range.start}T12:00:00`).getDay() + 6) % 7) + 1));
                }
              }}
              firstDay={context.today}
              lastDay={context.rules.lastDay}
              getDayState={(day) => getDayState(day, context)}
              getMaxEndDay={(day) => getMaxEndDay(day, context)}
              recurrenceFrequency={frequency}
              recurrenceStart={slot.startDay}
              singleMonth
              singleSelection
            />
          </div>
          <aside aria-label="Informations du créneau" className="space-y-5 lg:col-span-5">
            <fieldset>
              <legend className={fieldLabelVariants()}>Récurrence</legend>
              <div className="mt-2 flex flex-wrap gap-5">
                {WISH_FREQUENCIES.map((option) => (
                  <label key={option.value} className="flex cursor-pointer items-center gap-2 text-body-sm font-semibold text-ink">
                    <input
                      type="radio"
                      name={`wish-frequency-${baseId}`}
                      value={option.value}
                      checked={frequency === option.value}
                      onChange={() => {
                        setFrequency(option.value);
                        onChange('frequency', option.value);
                      }}
                      className="accent-primary"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-2">
              {(['start', 'end'] as const).map((fieldName) => (
                <button
                  key={fieldName}
                  type="button"
                  disabled={!slot.startDay}
                  aria-expanded={openTimeField === fieldName}
                  onClick={() => setOpenTimeField(openTimeField === fieldName ? null : fieldName)}
                  className="flex w-full items-center justify-between gap-3 rounded-control border border-line bg-white px-4 py-3 text-left"
                >
                  <span>
                    <span className="block text-label font-bold uppercase tracking-label text-muted">
                      {fieldName === 'start' ? 'Début' : 'Fin'}
                      {slot.startDay ? ` · ${formatShortDay(slot.startDay)}` : ''}
                    </span>
                    <span className="mt-0.5 block text-lg font-black tabular-nums text-ink">
                      {formatTime((fieldName === 'start' ? slot.startTime : slot.endTime) ?? '')}
                    </span>
                  </span>
                  <IconChevronRight className="h-4 w-4 text-muted" />
                </button>
              ))}
            </div>
            {openTimeField && (
              <TimeOptionsPanel
                label={openTimeField === 'start' ? 'Heure de début' : 'Heure de fin'}
                value={openTimeField === 'start' ? slot.startTime : slot.endTime}
                options={openTimeField === 'start' ? getStartOptions(slot, context) : getEndOptions(slot, context)}
                onChange={(time) => {
                  const next = openTimeField === 'start'
                    ? { ...slot, startTime: time }
                    : { ...slot, endTime: time };
                  setRawSlot(next);
                  onChange(openTimeField === 'start' ? 'startTime' : 'endTime', time);
                }}
                onDone={() => setOpenTimeField(null)}
              />
            )}

            {field('expectedAttendance', 'Effectif prévu', (id, invalid) => (
              <input type="number" min={1} inputMode="numeric" {...control('expectedAttendance', id, invalid)} />
            ))}
            {field('activity', 'Activité', (id, invalid) => (
              <input type="text" maxLength={120} placeholder="exemple : entraînement de basket U13" {...control('activity', id, invalid)} />
            ), true)}
          </aside>
        </section>
      )}
      <section aria-labelledby={`${baseId}-room-title`} className="space-y-4">
        <h3 id={`${baseId}-room-title`} className="text-lg font-black text-ink">Choisissez une salle</h3>
        {errors.salleId && <p role="alert" className={fieldHintVariants({ tone: 'danger' })}>{errors.salleId}</p>}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <li key={room.id}>
              <RoomCatalogCard
                room={room}
                isAvailable
                selected={wish.salleId === String(room.id)}
                onReserve={(selected) => onChange('salleId', String(selected.id))}
              />
            </li>
          ))}
        </ul>
      </section>
    </fieldset>
  );
}
