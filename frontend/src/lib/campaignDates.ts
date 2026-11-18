/**
 * Dates de la campagne annuelle.
 * - Les créneaux de salle sont des heures locales sans fuseau (« 2027-06-01T18:00:00 »).
 * - L'ouverture et la clôture d'une campagne sont des instants (ISO avec fuseau).
 */

const dayFormatter = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** « 2027-06-01T18:00:00 » → « 2027-06-01 ». */
export function slotDate(slot: string | null): string {
  return slot ? slot.slice(0, 10) : '';
}

/** « 2027-06-01T18:00:00 » → « 18:00 ». */
export function slotTime(slot: string | null): string {
  return slot ? slot.slice(11, 16) : '';
}

/** Date et heure saisies → créneau local « 2027-06-01T18:00:00 ». */
export function toSlot(date: string, time: string): string {
  return `${date}T${time}:00`;
}

/** « 18:00 » → « 18h00 ». */
export function formatSlotTime(slot: string | null): string {
  return slotTime(slot).replace(':', 'h');
}

/** « 09h00 – 12h00 », ou « 15/12 09h00 – 17/12 18h00 » sur plusieurs jours. */
export function formatSlotRange(start: string | null, end: string | null): string {
  const startDay = start?.slice(0, 10) ?? '';
  const endDay = end?.slice(0, 10) ?? '';
  if (startDay === endDay) return `${formatSlotTime(start)} – ${formatSlotTime(end)}`;

  const shortDay = (day: string) => day.slice(8) + '/' + day.slice(5, 7);
  return `${shortDay(startDay)} ${formatSlotTime(start)} – ${shortDay(endDay)} ${formatSlotTime(end)}`;
}

/** « 2027-06-01 » → « mardi 1 juin 2027 ». */
export function formatDayLabel(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return dayFormatter.format(new Date(year, month - 1, day));
}

export function formatInstantDate(iso: string): string {
  return shortDateFormatter.format(new Date(iso));
}

export function formatInstant(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/** Instant ISO → valeur d'un champ datetime-local, dans le fuseau du navigateur. */
export function toDateTimeInput(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Valeur d'un champ datetime-local → instant ISO. */
export function fromDateTimeInput(value: string): string {
  return new Date(value).toISOString();
}
