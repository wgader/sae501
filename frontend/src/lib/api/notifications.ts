import { request } from './client';
import type { AssociationNotification, AssociationNotificationsResponse } from './types';

export function getAssociationNotifications(): Promise<AssociationNotificationsResponse> {
  return request<AssociationNotificationsResponse>('/api/notifications?itemsPerPage=10');
}

export function markAssociationNotificationRead(id: number): Promise<AssociationNotification> {
  return request<AssociationNotification>(`/api/notifications/${id}/read`, { method: 'PATCH' });
}
