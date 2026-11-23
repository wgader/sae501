import type { AdminDashboard, AdminDashboardAgendaItem, AdminDashboardPending } from '@/lib/api/types';
import { routes } from '@/lib/routes';

/** Teinte d'une carte : chaque démarche garde la couleur qu'elle a côté associations. */
export type DashboardTone = 'registrations' | 'grants' | 'rooms' | 'equipment' | 'events';

export interface PendingQueue {
  key: keyof AdminDashboardPending;
  tone: DashboardTone;
  label: string;
  /** Ce que l'agent doit faire, au singulier et au pluriel. */
  task: [string, string];
  href: string;
}

/** Ordre d'affichage : d'abord les inscriptions, qui conditionnent tout le reste. */
export const PENDING_QUEUES: readonly PendingQueue[] = [
  { key: 'registrations', tone: 'registrations', label: 'Inscriptions', task: ['association à valider', 'associations à valider'], href: '/admin/inscription' },
  { key: 'grants', tone: 'grants', label: 'Subventions', task: ['dossier à instruire', 'dossiers à instruire'], href: '/admin/subvention' },
  { key: 'rooms', tone: 'rooms', label: 'Salles', task: ['demande à arbitrer', 'demandes à arbitrer'], href: '/admin/campagnes' },
  { key: 'equipment', tone: 'equipment', label: 'Matériel', task: ['prêt à valider', 'prêts à valider'], href: '/admin/materiel/demandes' },
  { key: 'events', tone: 'events', label: 'Évènements', task: ['déclaration à lire', 'déclarations à lire'], href: '/admin/evenements' },
];

export const AGENDA_TYPES: Record<AdminDashboardAgendaItem['type'], { label: string; tone: DashboardTone }> = {
  room: { label: 'Salle', tone: 'rooms' },
  equipment: { label: 'Retrait de matériel', tone: 'equipment' },
  event: { label: 'Évènement', tone: 'events' },
};

export function agendaHref(item: AdminDashboardAgendaItem): string {
  if (item.type === 'equipment') return routes.adminEquipmentRequest(item.id);
  if (item.type === 'event') return '/admin/evenements';
  return '/admin/campagnes';
}

export function totalPending(pending: AdminDashboardPending): number {
  return Object.values(pending).reduce((sum, count) => sum + count, 0);
}

export function plural(count: number, [one, many]: [string, string]): string {
  return count > 1 ? many : one;
}

/** Phrase d'accroche du bandeau d'accueil, selon la charge du jour. */
export function workloadSummary(dashboard: AdminDashboard): string {
  const total = totalPending(dashboard.pending);
  if (total === 0) return 'Aucun dossier n’attend de décision : tout est à jour.';
  const busiest = PENDING_QUEUES.reduce((best, queue) => (dashboard.pending[queue.key] > dashboard.pending[best.key] ? queue : best));
  return `${total} ${plural(total, ['dossier attend', 'dossiers attendent'])} une décision, dont ${dashboard.pending[busiest.key]} côté ${busiest.label.toLowerCase()}.`;
}

const dayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const weekdayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
const timeFormat = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const shortDateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });

export function formatToday(date: Date): string {
  const label = dayFormat.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function agendaDate(iso: string): { day: string; weekday: string; time: string } {
  const date = new Date(iso);
  return { day: String(date.getDate()), weekday: weekdayFormat.format(date).replace('.', ''), time: timeFormat.format(date) };
}

export function formatShortDate(iso: string | null): string | null {
  return iso ? shortDateFormat.format(new Date(iso)) : null;
}

/** « aujourd'hui », « hier » ou « il y a 5 jours » pour les inscriptions récentes. */
export function relativeDays(iso: string | null, now: Date): string | null {
  if (!iso) return null;
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'aujourd’hui';
  if (days === 1) return 'hier';
  return `il y a ${days} jours`;
}
