'use client';

import NotificationBell from '@/components/notifications/NotificationBell';
import type { AssociationNotification } from '@/lib/api';

const ADMIN_ROUTES: Record<string, string> = {
  SALLE_RESERVATION_CANCELLED_AGENT: '/admin/campagnes',
  MATERIEL_RESERVATION_CANCELLED_AGENT: '/admin/materiel',
};

function notificationHref(notification: AssociationNotification): string {
  return ADMIN_ROUTES[notification.type] ?? '/admin/dashboard';
}

/** Notifications des agents (annulations des associations, etc.), dans l'en-tête de l'administration. */
export default function AdminNotificationBell() {
  return <NotificationBell resolveHref={notificationHref} placement="inline" />;
}
