import type { CampaignWishInput, PublicRoom } from '@/lib/api';

export const WISH_DAYS = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' },
] as const;

export const WISH_FREQUENCIES = [
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'biweekly', label: 'Bimensuelle (une semaine sur deux)' },
] as const;

export const WISH_AUDIENCES = [
  { value: 'youth', label: 'Jeunes (moins de 18 ans)' },
  { value: 'adults', label: 'Adultes' },
  { value: 'seniors', label: 'Seniors' },
  { value: 'all', label: 'Tous publics' },
  { value: 'disability', label: 'Public en situation de handicap' },
] as const;

export const MAX_WISHES = 20;

/** Ligne du formulaire : les champs restent des chaînes tant que l'association saisit. */
export type WishDraft = {
  key: string;
  salleId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  frequency: string;
  activity: string;
  audience: string;
  expectedAttendance: string;
};

export type WishField = Exclude<keyof WishDraft, 'key'>;
export type WishErrors = Partial<Record<WishField, string>>;

let sequence = 0;
export function emptyWish(): WishDraft {
  sequence += 1;
  return {
    key: `wish-${sequence}`,
    salleId: '',
    dayOfWeek: '',
    startTime: '18:00',
    endTime: '20:00',
    frequency: 'weekly',
    activity: '',
    audience: '',
    expectedAttendance: '',
  };
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Mêmes règles que le serveur : l'association voit l'erreur avant d'envoyer. */
export function validateWish(wish: WishDraft, rooms: PublicRoom[]): WishErrors {
  const errors: WishErrors = {};
  const room = rooms.find((candidate) => String(candidate.id) === wish.salleId);
  if (!room) errors.salleId = 'Choisissez une salle.';
  if (!wish.dayOfWeek) errors.dayOfWeek = 'Choisissez un jour.';
  if (!TIME.test(wish.startTime)) errors.startTime = 'Heure au format HH:mm.';
  if (!TIME.test(wish.endTime)) errors.endTime = 'Heure au format HH:mm.';
  else if (TIME.test(wish.startTime) && wish.endTime <= wish.startTime) errors.endTime = 'La fin doit être après le début.';
  if (!wish.frequency) errors.frequency = 'Choisissez une fréquence.';
  if (!wish.activity.trim()) errors.activity = 'Décrivez l’activité.';
  else if (wish.activity.trim().length > 120) errors.activity = '120 caractères au plus.';
  if (!wish.audience) errors.audience = 'Choisissez le public.';
  const attendance = Number(wish.expectedAttendance);
  if (!Number.isInteger(attendance) || attendance < 1) errors.expectedAttendance = 'Au moins une personne.';
  else if (room?.capaciteMax && attendance > room.capaciteMax) errors.expectedAttendance = `Capacité de la salle : ${room.capaciteMax} personnes.`;
  return errors;
}

/** Deux vœux du même dossier sur la même salle, le même jour, aux horaires qui se chevauchent. */
export function overlappingWishes(wishes: WishDraft[]): Set<string> {
  const keys = new Set<string>();
  wishes.forEach((wish, index) => {
    wishes.slice(index + 1).forEach((other) => {
      if (
        wish.salleId && wish.salleId === other.salleId && wish.dayOfWeek && wish.dayOfWeek === other.dayOfWeek &&
        wish.startTime < other.endTime && other.startTime < wish.endTime
      ) {
        keys.add(wish.key);
        keys.add(other.key);
      }
    });
  });
  return keys;
}

export function toWishInput(wish: WishDraft): CampaignWishInput {
  return {
    salleId: Number(wish.salleId),
    dayOfWeek: Number(wish.dayOfWeek),
    startTime: wish.startTime,
    endTime: wish.endTime,
    frequency: wish.frequency,
    activity: wish.activity.trim(),
    audience: wish.audience,
    expectedAttendance: Number(wish.expectedAttendance),
  };
}

export const labelOf = <T extends { value: string | number; label: string }>(options: readonly T[], value: string | number) =>
  options.find((option) => String(option.value) === String(value))?.label ?? '';
