'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  getAssociationNotifications,
  markAssociationNotificationRead,
  type AssociationNotification,
} from '@/lib/api';

function notificationHref(notification: AssociationNotification): string {
  if (!notification.event_id) return '/historique';
  if (notification.type === 'EVENT_FILES_REQUESTED') {
    return `/historique/event-${notification.event_id}/pieces-annexes?type=evenement`;
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
  const [notifications, setNotifications] = useState<AssociationNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await getAssociationNotifications();
      setNotifications(response.items);
      setUnreadCount(response.unreadCount);
    } catch {
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadNotifications(), 0);
    const timer = window.setInterval(() => void loadNotifications(), 60000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [loadNotifications]);

  async function handleOpen(notification: AssociationNotification) {
    if (!notification.read_at) {
      try {
        await markAssociationNotificationRead(notification.id);
        setUnreadCount((count) => Math.max(0, count - 1));
        setNotifications((items) => items.map((item) => item.id === notification.id
          ? { ...item, read_at: new Date().toISOString() }
          : item));
      } catch {
        // The destination remains available even if marking as read fails.
      }
    }
    setOpen(false);
  }

  return (
    <div className="fixed right-5 top-5 z-50">
      <button
        type="button"
        aria-label={unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Notifications'}
        aria-expanded={open}
        onClick={() => setOpen((visible) => !visible)}
        className="relative flex h-10 w-10 items-center justify-center rounded-control border border-line bg-white text-primary hover:bg-primary-soft"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17H9m10-2.5c-1.1-1.1-2-2.8-2-5a5 5 0 0 0-10 0c0 2.2-.9 3.9-2 5-.4.4-.1 1.1.5 1.1h15c.6 0 .9-.7.5-1.1ZM13.5 20h-3" />
        </svg>
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-pill bg-danger px-1 text-caption font-black text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open && (
        <aside className="absolute right-0 top-12 z-50 w-80 rounded-card border border-line bg-white p-4 shadow-panel" aria-label="Notifications">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-black text-ink">Notifications</h2>
            <span className="text-xs text-muted">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</span>
          </div>
          {notifications.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Aucune notification.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {notifications.slice(0, 5).map((notification) => (
                <li key={notification.id}>
                  <Link href={notificationHref(notification)} onClick={() => void handleOpen(notification)} className={`block rounded-soft p-3 text-left hover:bg-primary-soft ${notification.read_at ? 'bg-paper' : 'bg-primary-soft'}`}>
                    <p className="text-xs font-bold text-ink">{notification.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{notification.message}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}
    </div>
  );
}
