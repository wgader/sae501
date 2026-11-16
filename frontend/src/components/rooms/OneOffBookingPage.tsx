'use client';

import RoomBookingFlow from '@/components/rooms/RoomBookingFlow';
import RoomCampaignNotice from '@/components/rooms/RoomCampaignNotice';
import { useCurrentCampaign } from '@/hooks/useCurrentCampaign';

/** Réservation ponctuelle d'une salle, hors campagne : premier arrivé, premier servi. */
export default function OneOffBookingPage() {
  const campaignState = useCurrentCampaign();

  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-328 space-y-8">
        <header className="border-b border-line pb-6">
          <p className="text-label font-bold uppercase tracking-eyebrow text-primary">Salles municipales</p>
          <h1 className="mt-1 text-3xl font-black tracking-display text-ink sm:text-4xl">Réservation ponctuelle</h1>
          <p className="mt-2 max-w-2xl text-body-sm text-muted">
            Réservez une salle sur un créneau resté libre, en dehors de la campagne annuelle.
          </p>
        </header>

        {campaignState && <RoomCampaignNotice state={campaignState} mode="one-off" />}

        {campaignState && !campaignState.active && <RoomBookingFlow campaign={null} enabled />}
      </div>
    </main>
  );
}
