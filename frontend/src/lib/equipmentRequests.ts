import type { AdminEquipmentReservation, AssociationStatus } from '@/lib/api';

/** Badge d’une demande : couleur selon l’avancement, libellé réel du statut. */
export function requestStatusBadge(statut: AdminEquipmentReservation['statut']): { status: AssociationStatus; label: string } {
  if (statut === 'Validée' || statut === 'Clôturée') return { status: 'VALIDATED', label: statut };
  if (statut === 'Refusée') return { status: 'REFUSED', label: statut };
  return { status: 'PENDING_VALIDATION', label: statut };
}

const shortDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' });
const fullDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Paris' });

/** « 12 déc. → 13 déc. 2026 » : période d’emprunt. */
export function formatBorrowPeriod(start: string | null, end: string | null): string | null {
  if (!start) return null;
  if (!end) return fullDate.format(new Date(start));
  return `${shortDate.format(new Date(start))} → ${fullDate.format(new Date(end))}`;
}

/** « Déposée le 3 déc. 2026 » */
export const formatSubmittedAt = (iso: string | null) => (iso ? `Déposée le ${fullDate.format(new Date(iso))}` : null);

/** Nombre total d’unités demandées. */
export const totalUnits = (reservation: AdminEquipmentReservation) =>
  reservation.lignes.reduce((sum, line) => sum + (line.quantite ?? 0), 0);

/** « 4 × Barnum, 12 × Table pliante » */
export const linesSummary = (reservation: AdminEquipmentReservation) =>
  reservation.lignes.map((line) => `${line.quantite ?? 0} × ${line.designation ?? 'matériel supprimé'}`).join(', ');
