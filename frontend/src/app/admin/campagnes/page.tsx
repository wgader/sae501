'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import CampaignActiveBanner from '@/components/admin/campaign/CampaignActiveBanner';
import CampaignCalendar from '@/components/admin/campaign/CampaignCalendar';
import CampaignListTable from '@/components/admin/campaign/CampaignListTable';
import CampaignForm from '@/components/admin/campaign/CampaignForm';
import CampaignActionModal from '@/components/admin/campaign/CampaignActionModal';
import {
  getAdminCampaigns,
  createCampaign,
  openCampaign,
  closeCampaign,
  type CreateCampaignPayload,
} from '@/lib/api/campaigns';
import type { Campaign } from '@/lib/api/types';

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormView, setIsFormView] = useState(false);

  // Modale d'action rapide (ouverture / clôture manuelle)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'open' | 'close' | null;
    campaign: Campaign | null;
  }>({
    isOpen: false,
    type: null,
    campaign: null,
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      const data = await getAdminCampaigns();
      setCampaigns(data);
    } catch {
      setNotification({
        type: 'error',
        message: 'Impossible de récupérer la liste des campagnes.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchCampaigns();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchCampaigns]);

  // Campagnes remarquables
  const activeCampaign = useMemo(
    () => campaigns.find((c) => c.status === 'ACTIVE') ?? null,
    [campaigns]
  );

  const programmedCampaign = useMemo(
    () => campaigns.find((c) => c.status === 'PROGRAMMED') ?? null,
    [campaigns]
  );

  // Soumission du formulaire de création (Scénario 1)
  const handleCreateCampaign = async (payload: CreateCampaignPayload) => {
    setIsSubmitting(true);
    try {
      const newCamp = await createCampaign(payload);
      setNotification({
        type: 'success',
        message: `La campagne "${newCamp.seasonLabel}" a été enregistrée avec succès.`,
      });
      setIsFormView(false);
      await fetchCampaigns();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création de la campagne.';
      setNotification({
        type: 'error',
        message: msg,
      });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmation d'action manuelle (Scénario 2 & 3)
  const handleConfirmAction = async () => {
    if (!actionModal.campaign || !actionModal.type) return;

    setIsSubmitting(true);
    try {
      if (actionModal.type === 'open') {
        const updated = await openCampaign(actionModal.campaign.id);
        setNotification({
          type: 'success',
          message: `La campagne "${updated.seasonLabel}" est désormais ouverte. Le guichet de vœux est actif.`,
        });
      } else if (actionModal.type === 'close') {
        const updated = await closeCampaign(actionModal.campaign.id);
        setNotification({
          type: 'success',
          message: `La campagne "${updated.seasonLabel}" a été clôturée. Les dépôts de vœux sont verrouillés.`,
        });
      }
      setActionModal({ isOpen: false, type: null, campaign: null });
      await fetchCampaigns();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue lors de l’opération.';
      setNotification({
        type: 'error',
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        {/* Toast de notification */}
        {notification && (
          <div
            role="status"
            className={`flex items-center justify-between rounded-control p-4 text-body-sm font-semibold shadow-xs ${
              notification.type === 'success'
                ? 'bg-sage text-moss border border-moss/20'
                : 'bg-danger/10 text-danger border border-danger/20'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>{notification.type === 'success' ? '✓' : '⚠️'}</span>
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-meta uppercase font-bold tracking-wider hover:opacity-75 cursor-pointer"
            >
              Fermer
            </button>
          </div>
        )}

        {isFormView ? (
          /* Vue Préparation / Configuration (Figma Image 2) */
          <CampaignForm
            isLoading={isSubmitting}
            onCancel={() => setIsFormView(false)}
            onSubmit={handleCreateCampaign}
          />
        ) : (
          /* Vue Principale : En-tête, Calendrier et suivi (Figma Image 1) */
          <div className="space-y-6">
            {/* Header de la page conforme au Figma Image 1 */}
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-wider text-ink sm:text-3xl">
                  CAMPAGNE ANNUELLE
                </h1>
                <p className="mt-1 max-w-2xl text-meta text-muted sm:text-body-sm">
                  Une campagne par an, du 1er juin au 30 septembre. Chaque association choisit les salles et les créneaux souhaités pendant cette période.
                </p>
              </div>

              {/* Bouton d'action unique en haut à droite */}
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormView(true)}
                  className="inline-flex h-11 items-center gap-2 rounded-control bg-primary px-5 text-meta font-bold uppercase tracking-label text-white shadow-xs transition-colors hover:bg-primary-hover cursor-pointer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>LANCER LA CAMPAGNE</span>
                </button>
              </div>
            </header>

            {/* Bannière d'état dynamique (si active ou programmée) */}
            <CampaignActiveBanner
              activeCampaign={activeCampaign}
              programmedCampaign={programmedCampaign}
              onOpenClick={(camp) =>
                setActionModal({ isOpen: true, type: 'open', campaign: camp })
              }
              onCloseClick={(camp) =>
                setActionModal({ isOpen: true, type: 'close', campaign: camp })
              }
            />

            {/* Calendrier dynamique fidèle à l'image 1 de Figma */}
            <CampaignCalendar />

            {/* Récapitulatif épuré des campagnes (sans bouton doublon d'ajout) */}
            <CampaignListTable
              campaigns={campaigns}
              isLoading={isLoading}
              onOpenClick={(camp) =>
                setActionModal({ isOpen: true, type: 'open', campaign: camp })
              }
              onCloseClick={(camp) =>
                setActionModal({ isOpen: true, type: 'close', campaign: camp })
              }
            />
          </div>
        )}

        {/* Modale de confirmation d'action rapide (ouvrir / clôturer) */}
        <CampaignActionModal
          isOpen={actionModal.isOpen}
          type={actionModal.type}
          campaign={actionModal.campaign}
          isLoading={isSubmitting}
          onClose={() => setActionModal({ isOpen: false, type: null, campaign: null })}
          onConfirm={handleConfirmAction}
        />
      </div>
    </AdminLayout>
  );
}
