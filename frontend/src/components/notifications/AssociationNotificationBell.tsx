'use client';

import NotificationBell from '@/components/notifications/NotificationBell';
import type { AssociationNotification } from '@/lib/api';

function notificationHref(notification: AssociationNotification): string {
  if (!notification.event_id) return '/historique';
  if (notification.type === 'EVENT_FILES_REQUESTED') {
    return `/historique/event-${notification.event_id}/pieces-annexes?type=evenement`;
  }
  if (notification.type === 'SALLE_RESERVATION_DECISION' || notification.type === 'SALLE_RESERVATION_CANCELLED') {
    return `/historique/sal-${notification.event_id}?type=salle`;
  }
  if (notification.type === 'MATERIEL_RESERVATION_CANCELLED') {
    return `/historique/mat-${notification.event_id}?type=materiel`;
  }
  if (notification.type === 'SALLE_DOCUMENTS_REQUESTED') {
    return `/historique/${notification.event_id}/pieces-annexes?type=salle`;
  }
  if (notification.type === 'MATERIEL_DOCUMENTS_REQUESTED' || notification.type === 'REQUEST_DOCUMENTS_REQUESTED') {
    return `/historique/${notification.event_id}/pieces-annexes?type=materiel`;
  }
  return '/historique';
}

export default function AssociationNotificationBell() {
  return <NotificationBell resolveHref={notificationHref} />;
}
