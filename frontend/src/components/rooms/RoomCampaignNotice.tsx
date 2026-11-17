import Link from 'next/link';
import Notice from '@/components/ui/Notice';
import { IconArrowRight } from '@/components/ui/icons';
import { formatDayLabel, formatInstant } from '@/lib/campaignDates';
import type { Campaign, CampaignCurrentResponse } from '@/lib/api/types';

export type RoomBookingMode = 'campaign' | 'one-off';

interface RoomCampaignNoticeProps {
  state: CampaignCurrentResponse;
  mode: RoomBookingMode;
}

const linkClassName = 'inline-flex items-center gap-1.5 text-meta font-bold uppercase tracking-label text-primary hover:underline';

function periodLabel(campaign: Campaign): string | null {
  const start = campaign.periodStart?.slice(0, 10);
  const end = campaign.periodEnd?.slice(0, 10);
  return start && end ? `du ${formatDayLabel(start)} au ${formatDayLabel(end)}` : null;
}

/** Ce que l'association peut faire, selon la campagne annuelle et le type de demande. */
export default function RoomCampaignNotice({ state, mode }: RoomCampaignNoticeProps) {
  const { campaign } = state;
  const period = campaign ? periodLabel(campaign) : null;

  if (mode === 'one-off') {
    if (state.active && campaign) {
      return (
        <Notice
          tone="locked"
          title="Réservations ponctuelles suspendues pendant la campagne"
          action={
            <Link href="/campagne" className={linkClassName}>
              Déposer une demande de campagne
              <IconArrowRight />
            </Link>
          }
        >
          La campagne « {campaign.seasonLabel} » est ouverte jusqu’au {formatInstant(campaign.closingAt)}. Les réservations
          ponctuelles reprendront à sa clôture, sur les créneaux restés libres.
        </Notice>
      );
    }
    if (campaign?.status === 'PROGRAMMED' && period) {
      return (
        <Notice tone="info" title="Une campagne arrive">
          Les créneaux {period} seront attribués lors de la campagne « {campaign.seasonLabel} », qui ouvrira le{' '}
          {formatInstant(campaign.openingAt)}.
          Les autres jours restent réservables ici.
        </Notice>
      );
    }
    return (
      <Notice tone="info" title="Premier arrivé, premier servi">
        Un créneau demandé est bloqué immédiatement pour votre association, en attendant la confirmation de la mairie.
      </Notice>
    );
  }

  if (state.active && campaign) {
    return (
      <Notice tone="success" title="La campagne est ouverte">
        Déposez vos demandes jusqu’au {formatInstant(campaign.closingAt)}
        {period ? `, pour des créneaux ${period}` : ''}. Plusieurs associations peuvent demander le même créneau : la
        mairie les départage lors de la réunion d’arbitrage.
      </Notice>
    );
  }

  if (campaign?.status === 'PROGRAMMED') {
    return (
      <Notice tone="info" title="La campagne n’est pas encore ouverte">
        Vous pourrez déposer vos demandes à partir du {formatInstant(campaign.openingAt)}
        {period ? `, pour des créneaux ${period}` : ''}.
      </Notice>
    );
  }

  if (campaign?.status === 'CLOSED') {
    return (
      <Notice
        tone="locked"
        title="La campagne est clôturée"
        action={
          <Link href="/salles" className={linkClassName}>
            Réserver un créneau resté libre
            <IconArrowRight />
          </Link>
        }
      >
        Vos demandes ne peuvent plus être modifiées ni annulées : la mairie les étudie et vous informera de ses décisions.
        Pour tout changement, contactez la mairie.
      </Notice>
    );
  }

  return (
    <Notice tone="info" title="Aucune campagne pour le moment">
      La mairie ouvre une campagne par an pour réserver les salles de la saison. Vous serez informé de son ouverture.
    </Notice>
  );
}
