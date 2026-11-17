'use client';

import { useCallback, useEffect, useState } from 'react';
import RoomBookingFlow from '@/components/rooms/RoomBookingFlow';
import RoomCampaignNotice from '@/components/rooms/RoomCampaignNotice';
import MyCampaignRequests from '@/components/campaign/MyCampaignRequests';
import Notice from '@/components/ui/Notice';
import { getMyCampaignRequests } from '@/lib/api/campaigns';
import type { MyCampaignRequestsResponse } from '@/lib/api/types';

/**
 * Campagne annuelle des salles côté association : dépôt des demandes pendant l'ouverture,
 * puis suivi des décisions. Après la clôture, tout est en lecture seule.
 */
export default function AssociationCampaignPage() {
  const [data, setData] = useState<MyCampaignRequestsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await getMyCampaignRequests());
      setError(null);
    } catch (err) {
      console.error('Chargement de la campagne impossible', err);
      setError(err instanceof Error ? err.message : 'Impossible de charger la campagne.');
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const campaign = data?.campaign ?? null;
  const isOpen = campaign?.status === 'ACTIVE';

  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-328 space-y-10">
        <header className="border-b border-line pb-6">
          <p className="text-label font-bold uppercase tracking-eyebrow text-primary">Salles municipales</p>
          <h1 className="mt-1 text-3xl font-black tracking-display text-ink sm:text-4xl">
            {campaign ? campaign.seasonLabel : 'Campagne des salles'}
          </h1>
          <p className="mt-2 max-w-2xl text-body-sm text-muted">
            Une fois par an, la mairie ouvre une campagne pour réserver les salles de la saison. Les demandes sont ensuite
            arbitrées avec toutes les associations.
          </p>
        </header>

        {error && <Notice tone="danger">{error}</Notice>}

        {data && <RoomCampaignNotice state={{ active: isOpen, campaign }} mode="campaign" />}

        {isOpen && campaign && (
          <section aria-labelledby="campaign-new-request" className="space-y-4">
            <h2 id="campaign-new-request" className="text-lg font-black text-ink sm:text-xl">
              Nouvelle demande
            </h2>
            <RoomBookingFlow campaign={campaign} enabled onCreated={() => void load()} />
          </section>
        )}

        {campaign && data && (
          <section aria-labelledby="campaign-my-requests" className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="campaign-my-requests" className="text-lg font-black text-ink sm:text-xl">
                Mes demandes
              </h2>
              <span className="text-body-sm text-muted">
                {data.requests.length} demande{data.requests.length > 1 ? 's' : ''}
              </span>
            </div>
            <MyCampaignRequests requests={data.requests} editable={isOpen} onChanged={load} />
          </section>
        )}
      </div>
    </main>
  );
}
