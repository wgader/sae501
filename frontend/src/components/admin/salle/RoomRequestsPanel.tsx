'use client';

import { useMemo, useState } from 'react';
import CampaignRequestFilters, { type CampaignRequestFilterValues } from '@/components/admin/campaign/CampaignRequestFilters';
import CampaignRequestList from '@/components/admin/campaign/CampaignRequestList';
import RefuseRequestDialog, { type ReasonIntent } from '@/components/admin/campaign/RefuseRequestDialog';
import { useRoomRequests } from '@/hooks/useRoomRequests';
import { applyRequestFilters, countRequestsByStatus } from '@/lib/roomRequestFilters';
import type { CampaignRequest } from '@/lib/api/types';

const INITIAL_FILTERS: CampaignRequestFilterValues = { status: 'pending', salleId: '', search: '' };

type ReasonDialogState = { intent: ReasonIntent; request: CampaignRequest } | null;

/**
 * Réservations ponctuelles déposées hors campagne : premier arrivé, premier servi. Le créneau
 * est bloqué dès le dépôt ; la mairie confirme, refuse ou annule.
 */
export default function RoomRequestsPanel() {
  const { requests, isLoading, error, actions } = useRoomRequests();
  const [filters, setFilters] = useState<CampaignRequestFilterValues>(INITIAL_FILTERS);
  const [reasonDialog, setReasonDialog] = useState<ReasonDialogState>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const salles = useMemo(() => {
    const byId = new Map<number, string>();
    requests.forEach((request) => {
      if (request.salle.id !== null) byId.set(request.salle.id, request.salle.nom ?? '');
    });
    return [...byId.entries()].map(([id, nom]) => ({ id, nom })).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  }, [requests]);

  const visible = applyRequestFilters(requests, filters);

  const accept = async (request: CampaignRequest) => {
    setActionError(null);
    try {
      await actions.accept(request);
      setFeedback(`Réservation de ${request.association.nom} confirmée. L’association a été prévenue.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'La réservation n’a pas pu être confirmée.');
    }
  };

  const confirmReason = async (request: CampaignRequest, reason: string) => {
    const intent = reasonDialog?.intent ?? 'refuse';
    await (intent === 'refuse' ? actions.refuse(request, reason) : actions.cancel(request, reason));
    setReasonDialog(null);
    setFeedback(
      intent === 'refuse'
        ? `Demande de ${request.association.nom} refusée : le créneau est libéré.`
        : `Réservation de ${request.association.nom} annulée : l’association et les agents ont été prévenus.`,
    );
  };

  const emptyMessage =
    filters.status === 'pending' && !filters.search && !filters.salleId
      ? 'Aucune réservation ponctuelle à traiter.'
      : 'Aucune réservation ne correspond à ces filtres.';

  return (
    <section aria-labelledby="room-requests-title" className="space-y-5">
      <header>
        <h2 id="room-requests-title" className="text-lg font-black text-ink sm:text-xl">
          Réservations ponctuelles
        </h2>
        <p className="mt-1 max-w-3xl text-body-sm text-muted">
          Demandes déposées hors campagne, sur les créneaux restés libres. Premier arrivé, premier servi : le créneau est
          bloqué dès le dépôt, en attendant votre confirmation.
        </p>
      </header>

      {feedback && (
        <div role="status" className="flex items-center justify-between gap-4 rounded-soft bg-primary-soft px-4 py-3 text-body-sm font-semibold text-primary">
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-meta font-bold uppercase tracking-label hover:underline">
            Fermer
          </button>
        </div>
      )}

      <CampaignRequestFilters values={filters} counts={countRequestsByStatus(requests)} salles={salles} onChange={setFilters} />

      {(error ?? actionError) && (
        <p role="alert" className="rounded-soft bg-danger/10 px-4 py-3 text-body-sm font-semibold text-danger">
          {error ?? actionError}
        </p>
      )}

      {isLoading && requests.length === 0 && (
        <p role="status" className="py-10 text-center text-body-sm text-muted">
          Chargement des réservations…
        </p>
      )}

      {!isLoading && !error && visible.length === 0 && (
        <p className="rounded-card border border-dashed border-line px-6 py-10 text-center text-body-sm text-muted">{emptyMessage}</p>
      )}

      {visible.length > 0 && (
        <CampaignRequestList
          requests={visible}
          allRequests={requests}
          onAccept={accept}
          onRefuse={(request) => setReasonDialog({ intent: 'refuse', request })}
          onCancel={(request) => setReasonDialog({ intent: 'cancel', request })}
        />
      )}

      <RefuseRequestDialog
        request={reasonDialog?.request ?? null}
        intent={reasonDialog?.intent}
        onClose={() => setReasonDialog(null)}
        onConfirm={confirmReason}
      />
    </section>
  );
}
