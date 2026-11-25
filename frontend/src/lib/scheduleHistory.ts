import type { ScheduleAttribution } from '@/lib/api';

const longDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });
const time = new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', minute: '2-digit', timeZone: 'Europe/Paris' });
const decimal = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/** « 17 septembre 2026 » */
export const formatLongDate = (iso: string) => longDate.format(new Date(iso));

/** « 9 h 00 – 11 h 30 » */
export const formatTimeRange = (start: string, end: string) =>
  `${time.format(new Date(start)).replace(':', ' h ')} – ${time.format(new Date(end)).replace(':', ' h ')}`;

/** « 2,5 h » */
export const formatHours = (hours: number) => `${decimal.format(hours)} h`;

export const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${count} ${count > 1 ? pluralForm : singular}`;

/** Intitulé de la carte : la salle réservée ou le prêt de matériel. */
export function attributionTitle(attribution: ScheduleAttribution): string {
  return attribution.type === 'salle'
    ? `Réservation · ${attribution.salle.nom ?? 'salle communale'}`
    : 'Prêt de matériel';
}

/** Pour la largeur des barres : part d’une valeur dans le maximum de la série. */
export const shareOf = (value: number, max: number) => (max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0);
