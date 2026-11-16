'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAdminAssociationEvents, type ExternalEvent } from '@/lib/api';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function AssociationEvenementsPage() {
  const params = useParams<{ id: string }>();
  const associationId = Number(params.id);
  const [events, setEvents] = useState<ExternalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void getAdminAssociationEvents(associationId)
      .then((response) => {
        if (active) setEvents(response.items);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Impossible de charger les événements.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [associationId]);

  return (
    <section className="space-y-5" aria-labelledby="events-title">
      <header>
        <h2 id="events-title" className="text-base font-bold text-ink">Événements déclarés</h2>
        <p className="mt-1 text-xs text-muted">Planning des manifestations publiques de l’association.</p>
      </header>
      {loading && <p className="rounded-card border border-line bg-white p-6 text-sm text-muted" role="status">Chargement des événements...</p>}
      {error && <p className="rounded-card border-l-4 border-danger bg-rose-50/70 p-4 text-sm font-semibold text-danger" role="alert">{error}</p>}
      {!loading && !error && events.length === 0 && (
        <p className="rounded-card border border-line bg-white p-6 text-sm italic text-muted">Aucun événement déclaré.</p>
      )}
      {!loading && !error && events.length > 0 && (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="rounded-card border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold uppercase text-ink">{event.title}</h3>
                  <p className="mt-1 text-xs text-muted">{event.event_type} · {event.location}</p>
                  <p className="mt-2 text-sm font-semibold text-ink">
                    {formatDate(event.start_date)} – {formatDate(event.end_time)}
                  </p>
                </div>
                <Link
                  href={`/admin/evenements/${event.id}/pieces-annexes`}
                  className="text-xs font-bold uppercase tracking-label text-primary hover:underline"
                >
                  Pièces annexes
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
