'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { IconClock, IconLocation, IconMembres } from '@/components/ui/icons';
import CampaignRequestStatusBadge, {
  ASSOCIATION_REQUEST_STATUS_LABELS,
} from '@/components/admin/campaign/CampaignRequestStatusBadge';
import { cancelAssociationRequest } from '@/lib/api';
import { formatDayLabel, formatSlotTime, slotDate } from '@/lib/campaignDates';
import type { CampaignRequest } from '@/lib/api/types';

interface MyCampaignRequestsProps {
  requests: CampaignRequest[];
  /** Les demandes ne sont modifiables que pendant la campagne ouverte. */
  editable: boolean;
  onChanged: () => Promise<void>;
}

/** Demandes de l'association pour la campagne, avec la décision de la mairie. */
export default function MyCampaignRequests({ requests, editable, onChanged }: MyCampaignRequestsProps) {
  const [cancelling, setCancelling] = useState<CampaignRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmCancel = async () => {
    if (!cancelling) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await cancelAssociationRequest(`sal-${cancelling.id}`, 'salle');
      setCancelling(null);
      await onChanged();
    } catch (err) {
      console.error('Annulation de la demande impossible', err);
      setError(err instanceof Error ? err.message : 'La demande n’a pas pu être annulée.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (requests.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-line px-6 py-10 text-center text-body-sm text-muted">
        Vous n’avez déposé aucune demande pour cette campagne.
      </p>
    );
  }

  return (
    <>
      <ul className="grid gap-4 lg:grid-cols-2">
        {requests.map((request) => {
          const day = slotDate(request.dateDebut);
          const canCancel = editable && (request.status === 'pending' || request.status === 'accepted');
          return (
            <li key={request.id}>
              <article aria-labelledby={`my-request-${request.id}`} className="flex h-full flex-col gap-4 rounded-card border border-line bg-white p-5">
                <header className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-label font-bold uppercase tracking-label text-primary first-letter:uppercase">
                      <time dateTime={day}>{formatDayLabel(day)}</time>
                    </p>
                    <h3 id={`my-request-${request.id}`} className="mt-1 truncate text-body font-black text-ink">
                      {request.motifEvenement}
                    </h3>
                  </div>
                  <CampaignRequestStatusBadge status={request.status} labels={ASSOCIATION_REQUEST_STATUS_LABELS} />
                </header>

                <ul className="grid gap-2 text-body-sm text-ink sm:grid-cols-3">
                  <li className="flex items-center gap-2">
                    <IconClock className="h-4 w-4 shrink-0 text-primary" />
                    {formatSlotTime(request.dateDebut)} – {formatSlotTime(request.dateFin)}
                  </li>
                  <li className="flex min-w-0 items-center gap-2">
                    <IconLocation className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{request.salle.nom}</span>
                  </li>
                  {request.capaciteAttendue !== null && (
                    <li className="flex items-center gap-2">
                      <IconMembres className="h-4 w-4 shrink-0 text-primary" />
                      {request.capaciteAttendue} pers.
                    </li>
                  )}
                </ul>

                {request.decisionComment && (
                  <p className="rounded-soft bg-paper px-3 py-2 text-meta text-ink">
                    <span className="block text-caption font-bold uppercase tracking-label text-muted">Message de la mairie</span>
                    {request.decisionComment}
                  </p>
                )}

                {canCancel && (
                  <footer className="mt-auto flex justify-end border-t border-line pt-4">
                    <Button variant="ghost" size="sm" onClick={() => setCancelling(request)}>
                      Annuler ma demande
                    </Button>
                  </footer>
                )}
              </article>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={cancelling !== null}
        size="sm"
        title="Annuler cette demande ?"
        description={cancelling ? `${cancelling.salle.nom} · ${formatDayLabel(slotDate(cancelling.dateDebut))}` : undefined}
        onClose={() => setCancelling(null)}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setCancelling(null)}>
              Garder la demande
            </Button>
            <Button variant="danger" size="sm" isLoading={isSubmitting} onClick={() => void confirmCancel()}>
              Annuler la demande
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-ink">
          La mairie est prévenue et le créneau est libéré pour les autres associations. Cette annulation est définitive.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-meta font-semibold text-danger">
            {error}
          </p>
        )}
      </Dialog>
    </>
  );
}
