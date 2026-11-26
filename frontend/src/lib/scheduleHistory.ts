import type { ScheduleAttribution } from '@/lib/api';

const time = new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', minute: '2-digit', timeZone: 'Europe/Paris' });
const decimal = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/** « 9 h 00 – 11 h 30 » */
export const formatTimeRange = (start: string, end: string) =>
  `${time.format(new Date(start)).replace(':', ' h ')} – ${time.format(new Date(end)).replace(':', ' h ')}`;

/** « 2,5 h » */
export const formatHours = (hours: number) => `${decimal.format(hours)} h`;

export const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${count} ${count > 1 ? pluralForm : singular}`;

const dayNumber = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', timeZone: 'Europe/Paris' });
const shortMonth = new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'Europe/Paris' });
const monthYear = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });
const dayMonth = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'Europe/Paris' });

/** Pavé de date : « 17 » et « sept. ». */
export const dateBadge = (iso: string) => ({ day: dayNumber.format(new Date(iso)), month: shortMonth.format(new Date(iso)) });

/** « 6 juin – 7 juin » */
export const formatDayRange = (start: string, end: string) => {
  const from = dayMonth.format(new Date(start));
  const to = dayMonth.format(new Date(end));
  return from === to ? from : `${from} – ${to}`;
};

/** Intitulé d’une attribution : la salle, ou le matériel prêté. */
export function attributionTitle(attribution: ScheduleAttribution): string {
  if (attribution.type === 'salle') return attribution.salle.nom ?? 'Salle communale';
  return attribution.lignes.map((line) => `${line.quantite} × ${line.designation ?? 'matériel'}`).join(' · ') || 'Matériel';
}

/** Regroupe les attributions (déjà triées) par mois : « septembre 2026 ». */
export function groupByMonth(attributions: ScheduleAttribution[]): { label: string; items: ScheduleAttribution[] }[] {
  const groups = new Map<string, ScheduleAttribution[]>();
  for (const attribution of attributions) {
    const label = monthYear.format(new Date(attribution.start));
    groups.set(label, [...(groups.get(label) ?? []), attribution]);
  }
  return [...groups].map(([label, items]) => ({ label, items }));
}

/** Pour la largeur des barres : part d’une valeur dans le maximum de la série. */
export const shareOf = (value: number, max: number) => (max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0);
