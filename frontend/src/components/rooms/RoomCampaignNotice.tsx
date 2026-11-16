import { cva } from 'class-variance-authority';
import { IconClock, IconInfo } from '@/components/ui/icons';
import { formatInstant } from '@/lib/campaignDates';
import type { CampaignCurrentResponse } from '@/lib/api/types';

const noticeStyles = cva('flex items-start gap-3 rounded-soft border p-4 sm:p-5', {
  variants: {
    tone: {
      open: 'border-primary/20 bg-primary-soft text-ink',
      closed: 'border-line bg-paper text-ink',
    },
  },
});

interface RoomCampaignNoticeProps {
  state: CampaignCurrentResponse;
}

/** Indique à l'association si elle peut déposer une demande de salle, selon la campagne annuelle. */
export default function RoomCampaignNotice({ state }: RoomCampaignNoticeProps) {
  const { campaign } = state;

  if (state.active && campaign) {
    return (
      <aside role="status" className={noticeStyles({ tone: 'open' })}>
        <IconClock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-body-sm">
          <strong className="font-bold">Campagne {campaign.seasonLabel} ouverte</strong> : déposez vos
          demandes jusqu&apos;au {formatInstant(campaign.closingAt)}.
        </p>
      </aside>
    );
  }

  let message = 'Aucune campagne de réservation n’est ouverte pour le moment.';
  if (campaign?.status === 'PROGRAMMED') {
    message = `La campagne ${campaign.seasonLabel} ouvrira le ${formatInstant(campaign.openingAt)}.`;
  } else if (campaign?.status === 'CLOSED') {
    message = `La campagne ${campaign.seasonLabel} est clôturée depuis le ${formatInstant(campaign.closingAt)}. La mairie étudie les demandes reçues et vous informera de ses décisions.`;
  }

  return (
    <aside role="status" className={noticeStyles({ tone: 'closed' })}>
      <IconInfo className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
      <div className="text-body-sm">
        <h2 className="font-bold">Les demandes de salle sont fermées</h2>
        <p className="mt-1 text-muted">
          {message} Pour un besoin urgent, contactez directement la mairie.
        </p>
      </div>
    </aside>
  );
}
