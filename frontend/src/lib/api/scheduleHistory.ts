import { request } from './client';
import type { ScheduleHistory } from './types';

/**
 * Bilan des salles et du matériel attribués. Une association reçoit toujours le sien ;
 * un agent de la mairie précise l’association consultée.
 */
export function getScheduleHistory(associationId?: number): Promise<ScheduleHistory> {
  const query = associationId === undefined ? '' : `?${new URLSearchParams({ asso_id: String(associationId) })}`;
  return request<ScheduleHistory>(`/api/schedules/history${query}`);
}
