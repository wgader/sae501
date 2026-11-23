'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  acceptCampaignRequest,
  addCampaignSlot,
  cancelCampaignRequest,
  notifyCampaignConflict,
  getCampaignRequests,
  refuseCampaignRequest,
  rescheduleCampaignRequest,
  type AddCampaignSlotPayload,
  type CampaignSlotPayload,
} from '@/lib/api/campaigns';
import type { CampaignRequest } from '@/lib/api/types';
import { logger } from '@/lib/logger';

export interface CampaignRequestActions {
  accept: (request: CampaignRequest) => Promise<CampaignRequest>;
  refuse: (request: CampaignRequest, reason: string) => Promise<CampaignRequest>;
  reschedule: (request: CampaignRequest, slot: CampaignSlotPayload, reason: string) => Promise<CampaignRequest>;
  addSlot: (payload: AddCampaignSlotPayload) => Promise<CampaignRequest>;
  cancel: (request: CampaignRequest, reason: string) => Promise<CampaignRequest>;
  notifyConflict: (request: CampaignRequest) => Promise<number>;
}

/**
 * Demandes de salle d'une campagne et décisions de la mairie. Après chaque décision, la liste
 * est rechargée pour mettre à jour les chevauchements entre demandes.
 */
export function useCampaignRequests(campaignId: number | null) {
  const [requests, setRequests] = useState<CampaignRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (campaignId === null) {
      setRequests([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCampaignRequests(campaignId);
      setRequests(data.requests);
    } catch (err) {
      logger.error('Chargement des demandes de campagne impossible', err);
      setError('Impossible de charger les demandes de cette campagne.');
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  const withReload = useCallback(
    async (action: () => Promise<CampaignRequest>) => {
      const result = await action();
      await reload();
      return result;
    },
    [reload],
  );

  const requireCampaign = useCallback((): number => {
    if (campaignId === null) throw new Error('Aucune campagne sélectionnée.');
    return campaignId;
  }, [campaignId]);

  const actions: CampaignRequestActions = {
    accept: (request) => withReload(() => acceptCampaignRequest(requireCampaign(), request.id)),
    refuse: (request, reason) => withReload(() => refuseCampaignRequest(requireCampaign(), request.id, reason)),
    reschedule: (request, slot, reason) =>
      withReload(() => rescheduleCampaignRequest(requireCampaign(), request.id, { ...slot, reason })),
    addSlot: (payload) => withReload(() => addCampaignSlot(requireCampaign(), payload)),
    cancel: (request, reason) => withReload(() => cancelCampaignRequest(requireCampaign(), request.id, reason)),
    notifyConflict: async (request) => (await notifyCampaignConflict(requireCampaign(), request.id)).notified,
  };

  return { requests, isLoading, error, reload, actions };
}
