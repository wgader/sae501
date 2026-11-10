'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAdminAssociationRequests, type AssociationRequestSummary } from '@/lib/api';
import { useAssociationContext } from '../AssociationContext';

export default function AssociationHistoriquePage() {
  const { id } = useAssociationContext();
  const [requests, setRequests] = useState<AssociationRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void getAdminAssociationRequests(id)
      .then((response) => {
        if (active) setRequests(response.items);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Impossible de charger l’historique.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const annexableRequests = requests.filter((request) => request.type !== 'subvention');

  return (
    <section className="space-y-5" aria-labelledby="history-title">
      <header>
        <h2 id="history-title" className="text-base font-bold text-ink">Historique des démarches</h2>
        <p className="mt-1 text-xs text-muted">Consultez les demandes et leurs pièces annexes.</p>
      </header>
      {loading && <p className="rounded-card border border-line bg-white p-6 text-sm text-muted" role="status">Chargement de l’historique...</p>}
      {error && <p className="rounded-card border-l-4 border-danger bg-rose-50/70 p-4 text-sm font-semibold text-danger" role="alert">{error}</p>}
      {!loading && !error && annexableRequests.length === 0 && (
        <p className="rounded-card border border-line bg-white p-6 text-sm italic text-muted">Aucune demande avec pièces annexes.</p>
      )}
      {!loading && !error && annexableRequests.length > 0 && (
        <ul className="space-y-3">
          {annexableRequests.map((request) => (
            <li key={`${request.type}-${request.rawId}`} className="rounded-card border border-line bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase text-ink">{request.intitule}</p>
                  <p className="mt-1 text-xs text-muted">{request.typeLabel} · {request.statut}</p>
                </div>
                <Link
                  href={`/admin/association/${id}/historique/${request.type}/${request.rawId}/pieces-annexes`}
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
