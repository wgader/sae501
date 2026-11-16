'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { IconPlus } from '@/components/ui/icons';
import CampaignRequestFilters, {
  type CampaignRequestFilterValues,
  type CampaignRequestStatusFilter,
} from '@/components/admin/campaign/CampaignRequestFilters';
import CampaignRequestList from '@/components/admin/campaign/CampaignRequestList';
import RefuseRequestDialog from '@/components/admin/campaign/RefuseRequestDialog';
import SlotFormDialog, { type SlotFormSubmit } from '@/components/admin/campaign/SlotFormDialog';
import type { CampaignRequestActions } from '@/hooks/useCampaignRequests';
import type { CampaignRequest } from '@/lib/api/types';

interface Option {
  id: number;
  nom: string;
}

interface CampaignRequestsSectionProps {
  requests: CampaignRequest[];
  isLoading: boolean;
  error: string | null;
  salles: Option[];
  associations: Option[];
  actions: CampaignRequestActions;
  onFeedback: (message: string) => void;
}

type SlotDialogState = { mode: 'add' } | { mode: 'reschedule'; request: CampaignRequest } | null;

const INITIAL_FILTERS: CampaignRequestFilterValues = { status: 'pending', salleId: '', search: '' };

function countByStatus(requests: CampaignRequest[]): Record<CampaignRequestStatusFilter, number> {
  return requests.reduce(
    (counts, request) => ({ ...counts, [request.status]: counts[request.status] + 1, all: counts.all + 1 }),
    { pending: 0, accepted: 0, refused: 0, closed: 0, all: 0 },
  );
}

function applyFilters(requests: CampaignRequest[], filters: CampaignRequestFilterValues): CampaignRequest[] {
  const search = filters.search.trim().toLocaleLowerCase('fr');
  return requests.filter(
    (request) =>
      (filters.status === 'all' || request.status === filters.status) &&
      (!filters.salleId || String(request.salle.id) === filters.salleId) &&
      (!search || (request.association.nom ?? '').toLocaleLowerCase('fr').includes(search)),
  );
}

/** Suivi et décisions sur les demandes de salle de la campagne sélectionnée. */
export default function CampaignRequestsSection({
  requests,
  isLoading,
  error,
  salles,
  associations,
  actions,
  onFeedback,
}: CampaignRequestsSectionProps) {
  const [filters, setFilters] = useState<CampaignRequestFilterValues>(INITIAL_FILTERS);
  const [refusing, setRefusing] = useState<CampaignRequest | null>(null);
  const [slotDialog, setSlotDialog] = useState<SlotDialogState>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const counts = countByStatus(requests);
  const visibleRequests = applyFilters(requests, filters);
  const hasFilters = filters.status !== 'all' || filters.salleId !== '' || filters.search !== '';

  const accept = async (request: CampaignRequest) => {
    setActionError(null);
    try {
      await actions.accept(request);
      onFeedback(`Demande de ${request.association.nom} acceptée. L’association a été prévenue.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'La demande n’a pas pu être acceptée.');
    }
  };

  const refuse = async (request: CampaignRequest, reason: string) => {
    await actions.refuse(request, reason);
    setRefusing(null);
    onFeedback(`Demande de ${request.association.nom} refusée. L’association a été prévenue.`);
  };

  const submitSlot = async (values: SlotFormSubmit) => {
    if (slotDialog?.mode === 'reschedule') {
      await actions.reschedule(slotDialog.request, { salleId: values.salleId, dateDebut: values.dateDebut, dateFin: values.dateFin }, values.reason);
      onFeedback(`Demande de ${slotDialog.request.association.nom} modifiée et acceptée.`);
    } else if (values.associationId !== null) {
      await actions.addSlot({
        associationId: values.associationId,
        salleId: values.salleId,
        dateDebut: values.dateDebut,
        dateFin: values.dateFin,
        motifEvenement: values.motif,
      });
      onFeedback('Créneau attribué. L’association a été prévenue.');
    }
    setSlotDialog(null);
  };

  const emptyMessage = hasFilters
    ? 'Aucune demande ne correspond à ces filtres.'
    : 'Aucune demande pour cette campagne pour le moment.';

  return (
    <section aria-labelledby="campaign-requests-title" className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="campaign-requests-title" className="text-lg font-black text-ink sm:text-xl">
            Demandes de salle
          </h2>
          <p className="mt-1 text-body-sm text-muted">
            Acceptez, refusez ou déplacez chaque demande : l’association est prévenue par e-mail et dans son espace.
          </p>
        </div>
        <Button size="sm" leftIcon={<IconPlus className="h-4 w-4" />} onClick={() => setSlotDialog({ mode: 'add' })}>
          Ajouter un créneau
        </Button>
      </header>

      <CampaignRequestFilters values={filters} counts={counts} salles={salles} onChange={setFilters} />

      {actionError && (
        <p role="alert" className="rounded-soft bg-danger/10 px-4 py-3 text-body-sm font-semibold text-danger">
          {actionError}
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-soft bg-danger/10 px-4 py-3 text-body-sm font-semibold text-danger">
          {error}
        </p>
      )}

      {isLoading && requests.length === 0 && (
        <p role="status" className="py-10 text-center text-body-sm text-muted">
          Chargement des demandes…
        </p>
      )}

      {!isLoading && visibleRequests.length === 0 && !error && (
        <p className="rounded-card border border-dashed border-line px-6 py-10 text-center text-body-sm text-muted">
          {emptyMessage}
        </p>
      )}

      {visibleRequests.length > 0 && (
        <CampaignRequestList
          requests={visibleRequests}
          allRequests={requests}
          onAccept={accept}
          onReschedule={(request) => setSlotDialog({ mode: 'reschedule', request })}
          onRefuse={setRefusing}
        />
      )}

      <RefuseRequestDialog request={refusing} onClose={() => setRefusing(null)} onConfirm={refuse} />
      <SlotFormDialog
        open={slotDialog !== null}
        request={slotDialog?.mode === 'reschedule' ? slotDialog.request : null}
        salles={salles}
        associations={associations}
        onClose={() => setSlotDialog(null)}
        onSubmit={submitSlot}
      />
    </section>
  );
}
