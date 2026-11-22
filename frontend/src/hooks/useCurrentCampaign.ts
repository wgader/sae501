'use client';

import { useEffect, useState } from 'react';
import { getCurrentCampaign } from '@/lib/api/campaigns';
import type { CampaignCurrentResponse } from '@/lib/api/types';
import { logger } from '@/lib/logger';

/** État de la campagne annuelle des salles (ouverte, à venir, clôturée), côté association. */
export function useCurrentCampaign(): CampaignCurrentResponse | null {
  const [state, setState] = useState<CampaignCurrentResponse | null>(null);

  useEffect(() => {
    let active = true;
    getCurrentCampaign()
      .then((current) => {
        if (active) setState(current);
      })
      .catch((err: unknown) => {
        logger.error('Chargement de la campagne impossible', err);
        if (active) setState({ active: false, campaign: null });
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
