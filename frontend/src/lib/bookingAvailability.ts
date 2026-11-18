import { addDays } from '@/lib/campaignPlanning';
import type { OccupiedSlot, RoomBookingRules } from '@/lib/api/types';
import { roomDayKey } from '@/lib/roomFilters';

/** Créneau occupé, en heure locale : « 2026-12-15T09:00 ». */
export interface BusyInterval {
  start: string;
  end: string;
}

export interface SlotSelection {
  startDay: string | null;
  endDay: string | null;
  startTime: string | null;
  endTime: string | null;
}

export interface AvailabilityContext {
  rules: RoomBookingRules;
  busy: BusyInterval[];
  today: string;
  /** Minutes écoulées aujourd'hui : les horaires passés ne sont plus proposés. */
  nowMinutes: number;
  /** Jours encore réservables mais déjà entamés (stock limité pour le matériel). */
  limitedDays?: ReadonlySet<string>;
}

export type DayState = 'free' | 'partial' | 'full' | 'blocked' | 'unavailable';

export interface TimeOption {
  value: string;
  disabled: boolean;
}

export const EMPTY_SLOT: SlotSelection = { startDay: null, endDay: null, startTime: null, endTime: null };

const PREFERRED_START = '09:00';
const PREFERRED_END = '12:00';

/** Date et heure du navigateur, relevées une fois à l'ouverture de la page. */
export function readBookingClock(): { today: string; nowMinutes: number } {
  const now = new Date();
  return { today: roomDayKey(now), nowMinutes: now.getHours() * 60 + now.getMinutes() };
}

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function toTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** L'API renvoie l'heure locale de la salle : seule la partie date et heure est comparée. */
export function toBusyIntervals(slots: OccupiedSlot[]): BusyInterval[] {
  return slots.map((slot) => ({ start: slot.start.slice(0, 16), end: slot.end.slice(0, 16) }));
}

/** Plages occupées d'un jour, en minutes, fusionnées et limitées aux heures d'ouverture. */
function busyRanges(day: string, context: AvailabilityContext): [number, number][] {
  const opening = toMinutes(context.rules.openingTime);
  const closing = toMinutes(context.rules.closingTime);
  const ranges: [number, number][] = [];

  context.busy.forEach(({ start, end }) => {
    const startDay = start.slice(0, 10);
    const endDay = end.slice(0, 10);
    if (day < startDay || day > endDay) return;
    const from = day === startDay ? toMinutes(start.slice(11)) : opening;
    const to = day === endDay ? toMinutes(end.slice(11)) : closing;
    ranges.push([Math.max(from, opening), Math.min(to, closing)]);
  });
  if (day === context.today) ranges.push([opening, Math.min(context.nowMinutes + 1, closing)]);

  const merged: [number, number][] = [];
  ranges
    .filter(([from, to]) => to > from)
    .sort((a, b) => a[0] - b[0])
    .forEach(([from, to]) => {
      const last = merged[merged.length - 1];
      if (last && from <= last[1]) last[1] = Math.max(last[1], to);
      else merged.push([from, to]);
    });
  return merged;
}

function hasOpenWindow(day: string, context: AvailabilityContext): boolean {
  const closing = toMinutes(context.rules.closingTime);
  const { minMinutes } = context.rules;
  let cursor = toMinutes(context.rules.openingTime);

  for (const [from, to] of busyRanges(day, context)) {
    if (from - cursor >= minMinutes) return true;
    cursor = Math.max(cursor, to);
  }
  return closing - cursor >= minMinutes;
}

function blockedPeriod(day: string, rules: RoomBookingRules) {
  return rules.blockedPeriods.find((period) => day >= period.start && day <= period.end);
}

export function getDayState(day: string, context: AvailabilityContext): DayState {
  if (day < context.today || day > context.rules.lastDay) return 'unavailable';
  if (blockedPeriod(day, context.rules)) return 'blocked';
  if (!hasOpenWindow(day, context)) return 'full';
  if (context.limitedDays?.has(day)) return 'partial';
  return busyRanges(day, context).some(([from]) => from > toMinutes(context.rules.openingTime) || day !== context.today)
    ? 'partial'
    : 'free';
}

/** Dernier jour de fin possible : durée maximale, puis premier jour non réservable ou déjà occupé. */
export function getMaxEndDay(startDay: string, context: AvailabilityContext): string {
  const opening = toMinutes(context.rules.openingTime);
  const closing = toMinutes(context.rules.closingTime);
  const startRanges = busyRanges(startDay, context);
  // Occupé jusqu'à la fermeture : impossible de démarrer ce jour-là pour continuer le lendemain.
  if ((startRanges[startRanges.length - 1]?.[1] ?? 0) >= closing) return startDay;

  let last = startDay;
  for (let offset = 1; offset < context.rules.maxDays; offset += 1) {
    const day = addDays(startDay, offset);
    const state = getDayState(day, context);
    if (state === 'unavailable' || state === 'blocked' || state === 'full') return last;
    const firstBusy = busyRanges(day, context)[0]?.[0];
    if (firstBusy !== undefined && firstBusy <= opening) return last;
    last = day;
    if (firstBusy !== undefined) return last;
  }
  return last;
}

function allTimes(rules: RoomBookingRules): string[] {
  const times: string[] = [];
  for (let minutes = toMinutes(rules.openingTime); minutes <= toMinutes(rules.closingTime); minutes += rules.stepMinutes) {
    times.push(toTime(minutes));
  }
  return times;
}

export function getStartOptions(slot: SlotSelection, context: AvailabilityContext): TimeOption[] {
  const { startDay, endDay } = slot;
  const closing = toMinutes(context.rules.closingTime);
  if (!startDay) return allTimes(context.rules).map((value) => ({ value, disabled: true }));

  const ranges = busyRanges(startDay, context);
  const isMultiDay = endDay !== null && endDay !== startDay;
  const lastBusyEnd = ranges.length > 0 ? ranges[ranges.length - 1][1] : 0;

  return allTimes(context.rules).map((value) => {
    const minutes = toMinutes(value);
    if (isMultiDay) return { value, disabled: minutes >= closing || minutes < lastBusyEnd };

    const end = minutes + context.rules.minMinutes;
    const overlaps = ranges.some(([from, to]) => from < end && to > minutes);
    return { value, disabled: end > closing || overlaps };
  });
}

export function getEndOptions(slot: SlotSelection, context: AvailabilityContext): TimeOption[] {
  const { startDay, endDay, startTime } = slot;
  const closing = toMinutes(context.rules.closingTime);
  const opening = toMinutes(context.rules.openingTime);
  if (!startDay || !endDay || !startTime) return allTimes(context.rules).map((value) => ({ value, disabled: true }));

  const ranges = busyRanges(endDay, context);
  if (endDay !== startDay) {
    const firstBusy = ranges.length > 0 ? ranges[0][0] : closing;
    return allTimes(context.rules).map((value) => {
      const minutes = toMinutes(value);
      return { value, disabled: minutes <= opening || minutes > firstBusy };
    });
  }

  const start = toMinutes(startTime);
  const nextBusy = ranges.find(([from]) => from >= start)?.[0] ?? closing;
  return allTimes(context.rules).map((value) => {
    const minutes = toMinutes(value);
    return { value, disabled: minutes < start + context.rules.minMinutes || minutes > nextBusy };
  });
}

function pickTime(options: TimeOption[], current: string | null, preferred: string): string | null {
  const isFree = (time: string | null) => options.some((option) => option.value === time && !option.disabled);
  if (isFree(current)) return current;
  if (isFree(preferred)) return preferred;
  return options.find((option) => !option.disabled)?.value ?? null;
}

/** Ramène une sélection à ce qui reste possible (jours pris entre-temps, horaires occupés…). */
export function normalizeSlot(slot: SlotSelection, context: AvailabilityContext): SlotSelection {
  const { startDay } = slot;
  const startState = startDay ? getDayState(startDay, context) : null;
  if (!startDay || startState === 'unavailable' || startState === 'blocked' || startState === 'full') return EMPTY_SLOT;

  const maxEnd = getMaxEndDay(startDay, context);
  const endDay = slot.endDay && slot.endDay >= startDay && slot.endDay <= maxEnd ? slot.endDay : startDay;
  const withDays = { ...slot, startDay, endDay };

  const startTime = pickTime(getStartOptions(withDays, context), slot.startTime, PREFERRED_START);
  const withStart = { ...withDays, startTime };
  const endTime = pickTime(getEndOptions(withStart, context), slot.endTime, PREFERRED_END);

  return { ...withStart, endTime };
}

export function isSlotComplete(slot: SlotSelection): slot is { startDay: string; endDay: string; startTime: string; endTime: string } {
  return Boolean(slot.startDay && slot.endDay && slot.startTime && slot.endTime);
}

function dayDate(day: string): Date {
  return new Date(`${day}T12:00:00`);
}

const shortDayFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
const longDayFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/** « 2026-12-15 » → « mar. 15 déc. ». */
export function formatShortDay(day: string): string {
  return shortDayFormatter.format(dayDate(day));
}

/** « 2026-12-15 » → « mardi 15 décembre 2026 ». */
export function formatLongDay(day: string): string {
  return longDayFormatter.format(dayDate(day));
}

export function formatTime(time: string): string {
  return time.replace(':', 'h');
}

/** Résumé d'une sélection complète : « mar. 15 déc. · 09h00 – 12h00 ». */
export function formatSlotSummary(slot: { startDay: string; endDay: string; startTime: string; endTime: string }): string {
  if (slot.startDay === slot.endDay) {
    return `${formatShortDay(slot.startDay)} · ${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}`;
  }
  return `${formatShortDay(slot.startDay)} ${formatTime(slot.startTime)} → ${formatShortDay(slot.endDay)} ${formatTime(slot.endTime)}`;
}

export function countDays(startDay: string, endDay: string): number {
  return Math.round((dayDate(endDay).getTime() - dayDate(startDay).getTime()) / 86_400_000) + 1;
}

/** « 3 h », « 1 h 30 », ou « 2 jours » sur plusieurs jours. */
export function formatDuration(slot: { startDay: string; endDay: string; startTime: string; endTime: string }): string {
  if (slot.startDay !== slot.endDay) return `${countDays(slot.startDay, slot.endDay)} jours`;

  const minutes = toMinutes(slot.endTime) - toMinutes(slot.startTime);
  const rest = minutes % 60;
  if (minutes < 60) return `${minutes} min`;
  return rest === 0 ? `${minutes / 60} h` : `${Math.floor(minutes / 60)} h ${String(rest).padStart(2, '0')}`;
}
