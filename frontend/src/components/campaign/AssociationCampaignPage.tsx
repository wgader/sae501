'use client';

import { useCallback, useEffect, useState } from 'react';
import RoomCampaignNotice from '@/components/rooms/RoomCampaignNotice';
import MyCampaignRequests from '@/components/campaign/MyCampaignRequests';
import CampaignWishWizard from '@/components/campaign/wishes/CampaignWishWizard';
import MyCampaignWishes from '@/components/campaign/wishes/MyCampaignWishes';
import Notice from '@/components/ui/Notice';
import { getMyCampaignRequests, getMyCampaignWishes } from '@/lib/api';
import type { MyCampaignRequestsResponse, MyCampaignWishesResponse } from '@/lib/api/types';
import { logger } from '@/lib/logger';

/**
 * Campagne annuelle des salles côté association : dépôt des vœux de créneaux réguliers pendant
 * l'ouverture, puis suivi de l'arbitrage. Hors campagne, le formulaire est verrouillé.
 */
export default function AssociationCampaignPage() {
  const [wishes, setWishes] = useState<MyCampaignWishesResponse | null>(null);
  const [requests, setRequests] = useState<MyCampaignRequestsResponse | null>(null);
  const [closedDuringEntry, setClosedDuringEntry] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [wishData, requestData] = await Promise.all([getMyCampaignWishes(), getMyCampaignRequests()]);
      setWishes(wishData);
      setRequests(requestData);
      setError(null);
    } catch (err) {
      logger.error('Chargement de la campagne impossible', err);
      setError(err instanceof Error ? err.message : 'Impossible de charger la campagne.');
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const campaign = wishes?.campaign ?? null;
  const isOpen = campaign?.status === 'ACTIVE' && !closedDuringEntry;
  const submissions = wishes?.submissions ?? [];
  const wishCount = submissions.reduce((total, submission) => total + submission.wishes.length, 0);

  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-328 space-y-10">
        <header className="border-b border-line pb-6">
          <p className="text-label font-bold uppercase tracking-eyebrow text-primary">Salles municipales</p>
          <h1 className="mt-1 text-3xl font-black tracking-display text-ink sm:text-4xl">
            {campaign ? campaign.seasonLabel : 'Campagne des salles'}
          </h1>
          <p className="mt-2 max-w-2xl text-body-sm text-muted">
            Une fois par an, la mairie ouvre une campagne pour attribuer les créneaux réguliers de la saison. Indiquez vos
            vœux : la mairie les arbitre ensuite avec ceux de toutes les associations.
          </p>
        </header>

        {error && <Notice tone="danger">{error}</Notice>}

        {wishes && <RoomCampaignNotice state={{ active: isOpen, campaign: campaign && closedDuringEntry ? { ...campaign, status: 'CLOSED' } : campaign }} mode="campaign" />}

        {isOpen && campaign && (
          <CampaignWishWizard campaign={campaign} onSubmitted={() => void load()} onClosed={() => setClosedDuringEntry(true)} />
        )}

        {campaign && wishes && (
          <section aria-labelledby="campaign-my-wishes" className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="campaign-my-wishes" className="text-lg font-black text-ink sm:text-xl">Mes vœux transmis</h2>
              <span className="text-body-sm text-muted">{wishCount} vœu{wishCount > 1 ? 'x' : ''}</span>
            </div>
            <MyCampaignWishes submissions={submissions} />
          </section>
        )}

        {requests && requests.requests.length > 0 && (
          <section aria-labelledby="campaign-my-requests" className="space-y-4">
            <h2 id="campaign-my-requests" className="text-lg font-black text-ink sm:text-xl">Demandes datées</h2>
            <MyCampaignRequests requests={requests.requests} editable={isOpen} onChanged={load} />
          </section>
        )}
      </div>
    </main>
  );
}
