'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import Button from '@/components/ui/Button';
import { IconPlus } from '@/components/ui/icons';
import CampaignSummary, { type CampaignRequestCounts } from '@/components/admin/campaign/CampaignSummary';
import CampaignRequestsSection from '@/components/admin/campaign/CampaignRequestsSection';
import CampaignScheduleDialog from '@/components/admin/campaign/CampaignScheduleDialog';
import CampaignExportDialog from '@/components/admin/campaign/CampaignExportDialog';
import CampaignHistory from '@/components/admin/campaign/CampaignHistory';
import CampaignWishesSection from '@/components/admin/campaign/wishes/CampaignWishesSection';
import CampaignStateDialog, { type CampaignStateAction } from '@/components/admin/campaign/CampaignStateDialog';
import CreateCampaignDialog from '@/components/admin/campaign/CreateCampaignDialog';
import { fieldControlVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';
import { useCampaignRequests } from '@/hooks/useCampaignRequests';
import {
  closeCampaign,
  createCampaign,
  downloadCampaignPlanning,
  getAdminCampaigns,
  openCampaign,
  reopenCampaign,
  rescheduleCampaign,
  type CampaignSchedulePayload,
  type CampaignPlanningExportOptions,
  type CreateCampaignPayload,
} from '@/lib/api/campaigns';
import { getSalles } from '@/lib/api/salles';
import { getAssociations } from '@/lib/api/associations';
import { formatInstantDate, slotDate } from '@/lib/campaignDates';
import type { Campaign, CampaignRequest } from '@/lib/api/types';
import { logger } from '@/lib/logger';

interface Option {
  id: number;
  nom: string;
}

/** Campagne affichée par défaut : l'ouverte, sinon la prochaine programmée, sinon la plus récente. */
function defaultCampaign(campaigns: Campaign[]): Campaign | null {
  return (
    campaigns.find((campaign) => campaign.status === 'ACTIVE') ??
    campaigns.find((campaign) => campaign.status === 'PROGRAMMED') ??
    campaigns[0] ??
    null
  );
}

/** Premier et dernier jour demandés, pour préremplir la période de l'export. */
function requestedRange(requests: CampaignRequest[]): { from: string; to: string } | null {
  const days = requests.map((request) => slotDate(request.dateDebut)).filter(Boolean).sort();
  return days.length > 0 ? { from: days[0], to: days[days.length - 1] } : null;
}

const STATE_ACTIONS: Record<CampaignStateAction, (campaign: Campaign, closingAt: string) => Promise<Campaign>> = {
  open: (campaign) => openCampaign(campaign.id),
  close: (campaign) => closeCampaign(campaign.id),
  reopen: (campaign, closingAt) => reopenCampaign(campaign.id, closingAt),
};

const STATE_FEEDBACK: Record<CampaignStateAction, string> = {
  open: 'La campagne est ouverte.',
  close: 'La campagne est clôturée : les associations ne peuvent plus modifier leurs demandes.',
  reopen: 'La campagne est rouverte avec toutes ses demandes.',
};

function countRequests(requests: CampaignRequest[]): CampaignRequestCounts {
  return requests.reduce(
    (counts, request) => ({ ...counts, [request.status]: counts[request.status] + 1 }),
    { pending: 0, accepted: 0, refused: 0, closed: 0 },
  );
}

export default function AdminCampaignsPage() {
  const selectorId = useId();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [salles, setSalles] = useState<Option[]>([]);
  const [associations, setAssociations] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingDates, setEditingDates] = useState<Campaign | null>(null);
  const [stateAction, setStateAction] = useState<CampaignStateAction | null>(null);
  const [exporting, setExporting] = useState<Campaign | null>(null);

  const selectedCampaign = campaigns.find((campaign) => campaign.id === selectedId) ?? null;
  const { requests, isLoading: requestsLoading, error: requestsError, actions } = useCampaignRequests(selectedId);

  const loadCampaigns = useCallback(async (preferredId?: number) => {
    try {
      const data = await getAdminCampaigns();
      setCampaigns(data);
      setSelectedId((current) => preferredId ?? current ?? defaultCampaign(data)?.id ?? null);
    } catch (err) {
      logger.error('Chargement des campagnes impossible', err);
      setPageError('Impossible de charger les campagnes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCampaigns();
      void getSalles()
        .then((data) =>
          setSalles(data.filter((salle) => salle.isActive && !salle.deletedAt).map(({ id, nom }) => ({ id, nom }))),
        )
        .catch((err) => logger.error('Chargement des salles impossible', err));
      void getAssociations(1, 'VALIDATED', undefined, false, 100)
        .then((page) => setAssociations(page.items.map(({ id, nom }) => ({ id, nom }))))
        .catch((err) => logger.error('Chargement des associations impossible', err));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCampaigns]);

  const replaceCampaign = (updated: Campaign) =>
    setCampaigns((current) => current.map((campaign) => (campaign.id === updated.id ? updated : campaign)));

  const handleCreate = async (payload: CreateCampaignPayload) => {
    const created = await createCampaign(payload);
    setIsCreating(false);
    setFeedback(`La campagne « ${created.seasonLabel} » a été créée.`);
    await loadCampaigns(created.id);
  };

  const handleStateChange = async (campaign: Campaign, action: CampaignStateAction, closingAt?: string) => {
    const updated = await STATE_ACTIONS[action](campaign, closingAt ?? '');
    replaceCampaign(updated);
    setStateAction(null);
    setFeedback(STATE_FEEDBACK[action]);
  };

  const handleSchedule = async (campaign: Campaign, payload: CampaignSchedulePayload) => {
    const updated = await rescheduleCampaign(campaign.id, payload);
    replaceCampaign(updated);
    setEditingDates(null);
    setFeedback('Les dates de la campagne ont été mises à jour.');
  };

  const handleExport = async (campaign: Campaign, options: CampaignPlanningExportOptions) => {
    await downloadCampaignPlanning(campaign, options);
    setExporting(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        <AdminPageHeader
          title="Campagne des salles"
          description="Ouvrez la campagne annuelle, traitez les demandes des associations et attribuez les créneaux."
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            {campaigns.length > 1 ? (
              <div className="sm:w-80">
                <label htmlFor={selectorId} className={fieldLabelVariants()}>
                  Campagne affichée
                </label>
                <select
                  id={selectorId}
                  value={selectedId ?? ''}
                  onChange={(event) => setSelectedId(Number(event.target.value))}
                  className={fieldControlVariants()}
                >
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.seasonLabel} · {formatInstantDate(campaign.openingAt)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span />
            )}
            <Button variant="secondary" size="sm" leftIcon={<IconPlus className="h-4 w-4" />} onClick={() => setIsCreating(true)}>
              Nouvelle campagne
            </Button>
          </div>
        </AdminPageHeader>

        {feedback && (
          <div role="status" className="flex items-center justify-between gap-4 rounded-soft bg-primary-soft px-4 py-3 text-body-sm font-semibold text-primary">
            <span>{feedback}</span>
            <button type="button" onClick={() => setFeedback(null)} className="text-meta font-bold uppercase tracking-label hover:underline">
              Fermer
            </button>
          </div>
        )}

        {pageError && (
          <p role="alert" className="rounded-soft bg-danger/10 px-4 py-3 text-body-sm font-semibold text-danger">
            {pageError}
          </p>
        )}

        {isLoading && (
          <p role="status" className="py-10 text-center text-body-sm text-muted">
            Chargement des campagnes…
          </p>
        )}

        {!isLoading && !pageError && selectedCampaign === null && (
          <section className="rounded-card border border-dashed border-line px-6 py-12 text-center">
            <h2 className="text-lg font-black text-ink">Aucune campagne</h2>
            <p className="mx-auto mt-2 max-w-md text-body-sm text-muted">
              Créez la campagne annuelle : les demandes de salle déposées pendant son ouverture apparaîtront ici.
            </p>
            <Button className="mt-6" size="sm" leftIcon={<IconPlus className="h-4 w-4" />} onClick={() => setIsCreating(true)}>
              Créer la campagne
            </Button>
          </section>
        )}

        {selectedCampaign && (
          <>
            <CampaignSummary
              campaign={selectedCampaign}
              counts={countRequests(requests)}
              onOpen={() => setStateAction('open')}
              onClose={() => setStateAction('close')}
              onReopen={() => setStateAction('reopen')}
              onEditDates={() => setEditingDates(selectedCampaign)}
              onExport={() => setExporting(selectedCampaign)}
            />
            <CampaignRequestsSection
              periodStart={selectedCampaign.periodStart?.slice(0, 10) ?? null}
              requests={requests}
              isLoading={requestsLoading}
              error={requestsError}
              salles={salles}
              associations={associations}
              actions={actions}
              onFeedback={setFeedback}
            />
            <CampaignWishesSection campaignId={selectedCampaign.id} onFeedback={setFeedback} />
          </>
        )}

        {!isLoading && (
          <CampaignHistory
            currentId={selectedId}
            refreshKey={campaigns.map((campaign) => `${campaign.id}:${campaign.status}:${campaign.updatedAt}`).join('|')}
            onSelect={(campaign) => {
              setSelectedId(campaign.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </div>

      <CreateCampaignDialog open={isCreating} onClose={() => setIsCreating(false)} onSubmit={handleCreate} />
      <CampaignScheduleDialog campaign={editingDates} onClose={() => setEditingDates(null)} onSubmit={handleSchedule} />
      <CampaignExportDialog
        campaign={exporting}
        requestedRange={requestedRange(requests)}
        onClose={() => setExporting(null)}
        onExport={handleExport}
      />
      <CampaignStateDialog
        campaign={stateAction ? selectedCampaign : null}
        action={stateAction}
        onClose={() => setStateAction(null)}
        onConfirm={handleStateChange}
      />
    </AdminLayout>
  );
}
