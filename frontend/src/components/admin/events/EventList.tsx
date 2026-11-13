'use client';

import type { ExternalEvent } from '@/lib/api';
import EventStatusBadge from './EventStatusBadge';

interface EventListProps {
  events: ExternalEvent[];
  loading: boolean;
  onOpen: (event: ExternalEvent) => void;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date inconnue';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function EventList({ events, loading, onOpen }: EventListProps) {
  if (loading) {
    return <div className="rounded-card border border-line bg-paper py-16 text-center text-xs font-bold uppercase tracking-wider text-muted">Chargement des événements...</div>;
  }

  if (events.length === 0) {
    return <div className="rounded-card border border-line bg-paper py-16 text-center"><p className="font-bold text-ink">Aucun événement trouvé</p><p className="mt-1 text-xs text-muted">Modifiez vos filtres ou votre recherche.</p></div>;
  }

  return (
    <div className="overflow-hidden rounded-card border border-line bg-white shadow-xs">
      <div className="hidden grid-cols-4 gap-5 border-b border-line bg-paper px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted md:grid">
        <span>Manifestation</span>
        <span>Date</span>
        <span>Statut</span>
        <span className="text-right">Action</span>
      </div>
      <ul className="divide-y divide-line">
        {events.map((event) => (
          <li key={event.id} className="grid gap-4 px-5 py-5 md:grid-cols-4 md:items-center md:gap-5 md:px-6">
            <div className="min-w-0">
              <p className="truncate font-bold text-ink">{event.title}</p>
              <p className="mt-1 truncate text-xs text-muted">{event.event_type} · {event.location}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{formatDate(event.start_date)}</p>
              <p className="mt-1 text-xs text-muted">Dossier #{event.id}</p>
            </div>
            <EventStatusBadge status={event.status} />
            <button type="button" onClick={() => onOpen(event)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40">
              Voir les pièces
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
