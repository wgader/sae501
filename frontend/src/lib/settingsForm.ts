import type { EquipmentSettings, EquipmentSettingsInput, RoomSettings, RoomSettingsInput } from '@/lib/api/types';

export type FieldErrors = Record<string, string>;

/** Champs du formulaire, tels que saisis : les nombres restent du texte jusqu'à l'envoi. */
export type RoomSettingsDraft = { openingHour: string; closingHour: string; oneOffMaxDays: string };
export type EquipmentSettingsDraft = {
  deskOpening: string;
  deskClosing: string;
  pickupLocation: string;
  maxQuantityPerRequest: string;
  defaultMaxDays: string;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MIN_DESK_MINUTES = 30;

export function clearFieldError(errors: FieldErrors, field: string): FieldErrors {
  const next = { ...errors };
  delete next[field];
  return next;
}

export const HOURS = Array.from({ length: 25 }, (_, hour) => hour);

export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')} h`;
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function parseWhole(value: string): number | null {
  return /^\d+$/.test(value.trim()) ? Number(value.trim()) : null;
}

export function roomDraft(settings: RoomSettings): RoomSettingsDraft {
  return {
    openingHour: String(settings.openingHour),
    closingHour: String(settings.closingHour),
    oneOffMaxDays: String(settings.oneOffMaxDays),
  };
}

export function equipmentDraft(settings: EquipmentSettings): EquipmentSettingsDraft {
  return {
    deskOpening: settings.deskOpening,
    deskClosing: settings.deskClosing,
    pickupLocation: settings.pickupLocation ?? '',
    maxQuantityPerRequest: settings.maxQuantityPerRequest === null ? '' : String(settings.maxQuantityPerRequest),
    defaultMaxDays: String(settings.defaultMaxDays),
  };
}

/** Mêmes règles que le serveur, pour signaler l'erreur avant l'envoi. */
export function validateRoomDraft(draft: RoomSettingsDraft, maxDaysLimit: number): { errors: FieldErrors; input: RoomSettingsInput | null } {
  const errors: FieldErrors = {};
  const openingHour = parseWhole(draft.openingHour);
  const closingHour = parseWhole(draft.closingHour);
  const oneOffMaxDays = parseWhole(draft.oneOffMaxDays);

  if (openingHour === null || openingHour > 23) errors.openingHour = 'Choisissez une heure d’ouverture.';
  if (closingHour === null || closingHour < 1 || closingHour > 24) errors.closingHour = 'Choisissez une heure de fermeture.';
  else if (openingHour !== null && closingHour <= openingHour) errors.closingHour = 'La fermeture doit être après l’ouverture.';
  if (oneOffMaxDays === null || oneOffMaxDays < 1 || oneOffMaxDays > maxDaysLimit) {
    errors.oneOffMaxDays = `Indiquez un nombre de jours entre 1 et ${maxDaysLimit}.`;
  }

  if (Object.keys(errors).length > 0 || openingHour === null || closingHour === null || oneOffMaxDays === null) {
    return { errors, input: null };
  }
  return { errors, input: { openingHour, closingHour, oneOffMaxDays } };
}

export function validateEquipmentDraft(
  draft: EquipmentSettingsDraft,
  limits: EquipmentSettings['limits'],
): { errors: FieldErrors; input: EquipmentSettingsInput | null } {
  const errors: FieldErrors = {};
  const openingValid = TIME_PATTERN.test(draft.deskOpening);
  const closingValid = TIME_PATTERN.test(draft.deskClosing);

  if (!openingValid) errors.deskOpening = 'Indiquez une heure d’ouverture.';
  if (!closingValid) errors.deskClosing = 'Indiquez une heure de fermeture.';
  else if (openingValid && toMinutes(draft.deskClosing) - toMinutes(draft.deskOpening) < MIN_DESK_MINUTES) {
    errors.deskClosing = 'La fermeture doit suivre l’ouverture d’au moins 30 minutes.';
  }

  const pickupLocation = draft.pickupLocation.trim();
  if (pickupLocation.length > limits.pickupLocation) {
    errors.pickupLocation = `${limits.pickupLocation} caractères au maximum.`;
  }

  const maxQuantity = draft.maxQuantityPerRequest.trim() === '' ? null : parseWhole(draft.maxQuantityPerRequest);
  if (draft.maxQuantityPerRequest.trim() !== '' && (maxQuantity === null || maxQuantity < 1 || maxQuantity > limits.maxQuantityPerRequest)) {
    errors.maxQuantityPerRequest = `Entre 1 et ${limits.maxQuantityPerRequest}, ou laissez vide.`;
  }

  const defaultMaxDays = parseWhole(draft.defaultMaxDays);
  if (defaultMaxDays === null || defaultMaxDays < 1 || defaultMaxDays > limits.defaultMaxDays) {
    errors.defaultMaxDays = `Entre 1 et ${limits.defaultMaxDays} jours.`;
  }

  if (Object.keys(errors).length > 0 || defaultMaxDays === null) return { errors, input: null };
  return {
    errors,
    input: {
      deskOpening: draft.deskOpening,
      deskClosing: draft.deskClosing,
      pickupLocation: pickupLocation === '' ? null : pickupLocation,
      maxQuantityPerRequest: maxQuantity,
      defaultMaxDays,
    },
  };
}

export function formatAudit(updatedAt: string | null, updatedBy: string | null): string {
  if (!updatedAt) return 'Valeurs par défaut, jamais modifiées.';
  const date = new Date(updatedAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
  return updatedBy ? `Modifié le ${date} par ${updatedBy}.` : `Modifié le ${date}.`;
}
