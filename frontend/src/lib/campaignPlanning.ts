import { slotDate, slotTime } from '@/lib/campaignDates';
import type { CampaignRequest } from '@/lib/api/types';

/** Amplitude d'ouverture des salles, découpée en demi-heures. */
export const PLANNING_FIRST_HOUR = 8;
export const PLANNING_LAST_HOUR = 23;
export const PLANNING_SLOT_MINUTES = 30;
export const PLANNING_SLOTS = ((PLANNING_LAST_HOUR - PLANNING_FIRST_HOUR) * 60) / PLANNING_SLOT_MINUTES;
export const PLANNING_HOURS = Array.from(
  { length: PLANNING_LAST_HOUR - PLANNING_FIRST_HOUR },
  (_, index) => PLANNING_FIRST_HOUR + index,
);

const weekdayFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', timeZone: 'UTC' });
const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dayMonthFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' });

/** Les jours manipulés sont des chaînes AAAA-MM-JJ, calculées en UTC pour éviter les décalages. */
function toUtc(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, date));
}

function toDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayKey(): string {
  const now = new Date();
  return toDay(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

export function addDays(day: string, amount: number): string {
  const date = toUtc(day);
  date.setUTCDate(date.getUTCDate() + amount);
  return toDay(date);
}

/** Lundi de la semaine du jour donné. */
export function startOfWeek(day: string): string {
  const weekday = toUtc(day).getUTCDay();
  return addDays(day, weekday === 0 ? -6 : 1 - weekday);
}

export interface PlanningDay {
  key: string;
  weekday: string;
  dayNumber: number;
}

export function weekDays(monday: string): PlanningDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const key = addDays(monday, index);
    const date = toUtc(key);
    return { key, weekday: weekdayFormatter.format(date).replace('.', ''), dayNumber: date.getUTCDate() };
  });
}

export function weekLabel(monday: string): string {
  const sunday = addDays(monday, 6);
  return `Du ${dayMonthFormatter.format(toUtc(monday))} au ${dayMonthFormatter.format(toUtc(sunday))}`;
}

export function monthLabel(day: string): string {
  return monthFormatter.format(toUtc(day));
}

function minutesOf(slot: string | null): number {
  const [hours, minutes] = slotTime(slot).split(':').map(Number);
  return hours * 60 + minutes;
}

export interface PlacedRequest {
  request: CampaignRequest;
  /** Ligne de départ (1 = 8h00) et nombre de demi-heures occupées. */
  start: number;
  span: number;
  /** Colonne dans la journée, pour afficher côte à côte les demandes qui se chevauchent. */
  lane: number;
}

export interface PlacedDay {
  lanes: number;
  items: PlacedRequest[];
}

/**
 * Place les demandes d'une journée dans la grille. Deux demandes qui se chevauchent (même
 * salle ou non) sont posées dans des colonnes voisines pour rester lisibles.
 */
export function placeDay(requests: CampaignRequest[]): PlacedDay {
  const firstMinute = PLANNING_FIRST_HOUR * 60;
  const sorted = [...requests].sort((a, b) => minutesOf(a.dateDebut) - minutesOf(b.dateDebut));
  const laneEnds: number[] = [];
  const items = sorted.map((request) => {
    const startMinutes = Math.max(minutesOf(request.dateDebut), firstMinute);
    const endMinutes = Math.max(minutesOf(request.dateFin), startMinutes + PLANNING_SLOT_MINUTES);
    const start = Math.floor((startMinutes - firstMinute) / PLANNING_SLOT_MINUTES) + 1;
    const span = Math.max(1, Math.min(Math.ceil((endMinutes - startMinutes) / PLANNING_SLOT_MINUTES), PLANNING_SLOTS - start + 1));
    let laneIndex = laneEnds.findIndex((end) => end <= startMinutes);
    if (laneIndex === -1) {
      laneIndex = laneEnds.length;
      laneEnds.push(endMinutes);
    } else {
      laneEnds[laneIndex] = endMinutes;
    }
    return { request, start, span, lane: laneIndex + 1 };
  });

  return { lanes: Math.max(1, laneEnds.length), items };
}

/** Semaine affichée par défaut : celle de la première demande à traiter, sinon de la première demande. */
export function initialWeek(requests: CampaignRequest[]): string {
  const days = (status?: string) =>
    requests
      .filter((request) => !status || request.status === status)
      .map((request) => slotDate(request.dateDebut))
      .filter(Boolean)
      .sort();
  return startOfWeek(days('pending')[0] ?? days()[0] ?? todayKey());
}
