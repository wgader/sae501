'use client';

import NotificationBell from '@/components/notifications/NotificationBell';
import type { AssociationNotification } from '@/lib/api';
import { routes } from '@/lib/routes';

function notificationHref(notification: AssociationNotification): string | null {
  if (!notification.event_id) return null;
  if (notification.type === 'EVENT_FILES_REQUESTED') {
    return routes.requestAnnexes(`event-${notification.event_id}`, 'evenement');
  }
  if (notification.type === 'SALLE_RESERVATION_DECISION' || notification.type === 'SALLE_RESERVATION_CANCELLED') {
    return routes.request(`sal-${notification.event_id}`, 'salle');
  }
  if (notification.type === 'MATERIEL_RESERVATION_CANCELLED') {
    return routes.request(`mat-${notification.event_id}`, 'materiel');
  }
  if (notification.type === 'SALLE_DOCUMENTS_REQUESTED') {
    return routes.requestAnnexes(notification.event_id, 'salle');
  }
  if (notification.type === 'MATERIEL_DOCUMENTS_REQUESTED' || notification.type === 'REQUEST_DOCUMENTS_REQUESTED') {
    return routes.requestAnnexes(notification.event_id, 'materiel');
  }
  return null;
}

export default function AssociationNotificationBell() {
  return <NotificationBell resolveHref={notificationHref} />;
}
