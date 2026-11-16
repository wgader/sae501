'use client';

import { useState } from 'react';
import { cva } from 'class-variance-authority';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { IconPlus } from '@/components/ui/icons';
import CampaignRequestFilters, { type CampaignRequestFilterValues } from '@/components/admin/campaign/CampaignRequestFilters';
import CampaignRequestCard from '@/components/admin/campaign/CampaignRequestCard';
import CampaignRequestList from '@/components/admin/campaign/CampaignRequestList';
import CampaignPlanning from '@/components/admin/campaign/CampaignPlanning';
import RefuseRequestDialog, { type ReasonIntent } from '@/components/admin/campaign/RefuseRequestDialog';
import { formatDayLabel, slotDate } from '@/lib/campaignDates';
import SlotFormDialog, { type SlotFormSubmit } from '@/components/admin/campaign/SlotFormDialog';
import type { CampaignRequestActions } from '@/hooks/useCampaignRequests';
import { applyRequestFilters, competitorNames, countRequestsByStatus } from '@/lib/roomRequestFilters';
import type { CampaignRequest } from '@/lib/api/types';

interface Option {
  id: number;
  nom: string;
}

interface CampaignRequestsSectionProps {
  /** Premier jour réservable : semaine affichée par défaut sur le planning. */
  periodStart: string | null;
  requests: CampaignRequest[];
  isLoading: boolean;
  error: string | null;
  salles: Option[];
  associations: Option[];
  actions: CampaignRequestActions;
  onFeedback: (message: string) => void;
}

type SlotDialogState = { mode: 'add' } | { mode: 'reschedule'; request: CampaignRequest } | null;
type ReasonDialogState = { intent: ReasonIntent; request: CampaignRequest } | null;
type View = 'planning' | 'list';

const VIEWS: { value: View; label: string }[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'list', label: 'Liste' },
];

const viewTabVariants = cva('h-7 rounded-control px-4 text-meta font-bold uppercase tracking-label transition-colors cursor-pointer', {
  variants: {
    active: {
      true: 'bg-white text-primary shadow-xs',
      false: 'text-muted hover:text-ink',
    },
  },
});

const INITIAL_FILTERS: CampaignRequestFilterValues = { status: 'pending', salleId: '', search: '' };

/** Suivi et décisions sur les demandes de salle de la campagne sélectionnée. */
export default function CampaignRequestsSection({
  periodStart,
  requests,
  isLoading,
  error,
  salles,
  associations,
  actions,
  onFeedback,
}: CampaignRequestsSectionProps) {
  const [filters, setFilters] = useState<CampaignRequestFilterValues>(INITIAL_FILTERS);
  const [view, setView] = useState<View>('planning');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reasonDialog, setReasonDialog] = useState<ReasonDialogState>(null);
  const [slotDialog, setSlotDialog] = useState<SlotDialogState>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const counts = countRequestsByStatus(requests);
  const selected = requests.find((request) => request.id === selectedId) ?? null;
  const associationNames = new Map(requests.map((request) => [request.id, request.association.nom ?? '']));
  const visibleRequests = applyRequestFilters(requests, filters);
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

  const confirmReason = async (request: CampaignRequest, reason: string) => {
    const intent = reasonDialog?.intent ?? 'refuse';
    await (intent === 'refuse' ? actions.refuse(request, reason) : actions.cancel(request, reason));
    setReasonDialog(null);
    onFeedback(
      intent === 'refuse'
        ? `Demande de ${request.association.nom} refusée. L’association a été prévenue.`
        : `Réservation de ${request.association.nom} annulée. L’association et les agents ont été prévenus.`,
    );
  };

  const openReason = (intent: ReasonIntent) => (request: CampaignRequest) => {
    setSelectedId(null);
    setReasonDialog({ intent, request });
  };

  const openReschedule = (request: CampaignRequest) => {
    setSelectedId(null);
    setSlotDialog({ mode: 'reschedule', request });
  };

  const notifyConflict = async (request: CampaignRequest) => {
    setActionError(null);
    try {
      const notified = await actions.notifyConflict(request);
      onFeedback(`${notified} associations prévenues : leurs demandes seront départagées en réunion.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Les associations n’ont pas pu être prévenues.');
    }
  };

  const acceptSelected = async (request: CampaignRequest) => {
    await accept(request);
    setSelectedId(null);
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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="campaign-requests-title" className="text-lg font-black text-ink sm:text-xl">
            Demandes de salle
          </h2>
          <p className="mt-1 text-body-sm text-muted">
            Repérez les créneaux disputés sur le planning, puis acceptez, refusez ou déplacez chaque demande. L’association est
            prévenue par e-mail et dans son espace.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div role="group" aria-label="Affichage des demandes" className="flex h-9 items-center rounded-control bg-paper p-1 ring-1 ring-line">
            {VIEWS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={view === option.value}
                onClick={() => setView(option.value)}
                className={viewTabVariants({ active: view === option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Button size="sm" leftIcon={<IconPlus className="h-4 w-4" />} onClick={() => setSlotDialog({ mode: 'add' })}>
            Ajouter un créneau
          </Button>
        </div>
      </header>

      {view === 'list' && <CampaignRequestFilters values={filters} counts={counts} salles={salles} onChange={setFilters} />}

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

      {view === 'planning' && !error && (requests.length > 0 || !isLoading) && (
        <CampaignPlanning
          key={`${requests[0]?.campaignId ?? 'empty'}-${periodStart}`}
          requests={requests}
          periodStart={periodStart}
          salles={salles}
          onSelect={(request) => setSelectedId(request.id)}
        />
      )}

      {view === 'list' && !isLoading && visibleRequests.length === 0 && !error && (
        <p className="rounded-card border border-dashed border-line px-6 py-10 text-center text-body-sm text-muted">
          {emptyMessage}
        </p>
      )}

      {view === 'list' && visibleRequests.length > 0 && (
        <CampaignRequestList
          requests={visibleRequests}
          allRequests={requests}
          onAccept={accept}
          onReschedule={openReschedule}
          onRefuse={openReason('refuse')}
          onCancel={openReason('cancel')}
          onNotifyConflict={(request) => void notifyConflict(request)}
        />
      )}

      <Dialog
        open={selected !== null}
        title="Demande de salle"
        description={selected ? formatDayLabel(slotDate(selected.dateDebut)) : undefined}
        onClose={() => setSelectedId(null)}
      >
        {selected && (
          <CampaignRequestCard
            flat
            request={selected}
            competitors={competitorNames(selected, associationNames)}
            onAccept={(request) => void acceptSelected(request)}
            onReschedule={openReschedule}
            onRefuse={openReason('refuse')}
            onCancel={openReason('cancel')}
            onNotifyConflict={(request) => void notifyConflict(request)}
          />
        )}
      </Dialog>
      <RefuseRequestDialog
        request={reasonDialog?.request ?? null}
        intent={reasonDialog?.intent}
        onClose={() => setReasonDialog(null)}
        onConfirm={confirmReason}
      />
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
