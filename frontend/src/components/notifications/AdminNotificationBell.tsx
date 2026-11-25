'use client';

import NotificationBell from '@/components/notifications/NotificationBell';
import type { AssociationNotification } from '@/lib/api';
import { routes } from '@/lib/routes';

function notificationHref(notification: AssociationNotification): string | null {
  const id = notification.event_id;
  if (notification.type === 'EVENT_FILE_UPLOADED' && id) return routes.adminEventAnnexes(id);
  if (notification.type === 'MATERIEL_RESERVATION_CANCELLED_AGENT' && id) return routes.adminEquipmentRequest(id);
  if (notification.type === 'SALLE_RESERVATION_CANCELLED_AGENT') return '/admin/campagnes';
  return null;
}

/** Notifications des agents (annulations des associations, pièces déposées…), dans l'en-tête de l'administration. */
export default function AdminNotificationBell() {
  return <NotificationBell resolveHref={notificationHref} placement="inline" />;
}
