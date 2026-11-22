'use client';

import { useCallback, useEffect, useState } from 'react';
import { acceptRoomRequest, cancelRoomRequest, getRoomRequests, refuseRoomRequest } from '@/lib/api/campaigns';
import type { CampaignRequest } from '@/lib/api/types';
import { logger } from '@/lib/logger';

/** Réservations ponctuelles (hors campagne) et décisions de la mairie. */
export function useRoomRequests() {
  const [requests, setRequests] = useState<CampaignRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setRequests((await getRoomRequests()).requests);
    } catch (err) {
      logger.error('Chargement des réservations ponctuelles impossible', err);
      setError('Impossible de charger les réservations ponctuelles.');
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const actions = {
    accept: (request: CampaignRequest) => withReload(() => acceptRoomRequest(request.id)),
    refuse: (request: CampaignRequest, reason: string) => withReload(() => refuseRoomRequest(request.id, reason)),
    cancel: (request: CampaignRequest, reason: string) => withReload(() => cancelRoomRequest(request.id, reason)),
  };

  return { requests, isLoading, error, actions };
}
