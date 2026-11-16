import Button from '@/components/ui/Button';
import { IconCampagne, IconClock, IconDownload, IconEdit } from '@/components/ui/icons';
import CampaignStatusBadge from '@/components/admin/campaign/CampaignStatusBadge';
import { formatDayLabel, formatInstant } from '@/lib/campaignDates';
import type { Campaign, CampaignRequestStatus } from '@/lib/api/types';

export type CampaignRequestCounts = Record<CampaignRequestStatus, number>;

interface CampaignSummaryProps {
  campaign: Campaign;
  counts: CampaignRequestCounts;
  onOpen: () => void;
  onClose: () => void;
  onReopen: () => void;
  onEditDates: () => void;
  onExport: () => void;
}

const COUNTERS: { key: CampaignRequestStatus; label: string }[] = [
  { key: 'pending', label: 'À traiter' },
  { key: 'accepted', label: 'Acceptées' },
  { key: 'refused', label: 'Refusées' },
];

/** En-tête de la campagne sélectionnée : statut, période, compteurs et actions. */
export default function CampaignSummary({ campaign, counts, onOpen, onClose, onReopen, onEditDates, onExport }: CampaignSummaryProps) {
  const isOpen = campaign.status === 'ACTIVE';
  const isProgrammed = campaign.status === 'PROGRAMMED';
  const isClosed = campaign.status === 'CLOSED';
  const periodStart = campaign.periodStart?.slice(0, 10);
  const periodEnd = campaign.periodEnd?.slice(0, 10);

  return (
    <section
      aria-labelledby="campaign-summary-title"
      className="rounded-card border border-line bg-white p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <CampaignStatusBadge status={campaign.status} />
          <h2 id="campaign-summary-title" className="mt-3 text-xl font-black text-ink sm:text-2xl">
            {campaign.seasonLabel}
          </h2>
          <dl className="mt-3 grid gap-2 text-body-sm">
            <div className="flex items-start gap-2">
              <IconClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <dt className="sr-only">Dépôt des demandes</dt>
              <dd className="text-muted">
                Demandes du <time dateTime={campaign.openingAt}>{formatInstant(campaign.openingAt)}</time> au{' '}
                <time dateTime={campaign.closingAt}>{formatInstant(campaign.closingAt)}</time>
              </dd>
            </div>
            <div className="flex items-start gap-2">
              <IconCampagne className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <dt className="sr-only">Créneaux réservables</dt>
              <dd className="text-muted">
                {periodStart && periodEnd ? (
                  <>
                    Créneaux du <time dateTime={periodStart}>{formatDayLabel(periodStart)}</time> au{' '}
                    <time dateTime={periodEnd}>{formatDayLabel(periodEnd)}</time>
                  </>
                ) : (
                  'Créneaux réservables non définis : tous les jours sont acceptés.'
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:shrink-0">
          <Button variant="secondary" size="sm" leftIcon={<IconDownload className="h-4 w-4" />} onClick={onExport}>
            Planning PDF
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<IconEdit className="h-4 w-4" />} onClick={onEditDates}>
            Modifier les dates
          </Button>
          {isClosed && (
            <Button size="sm" onClick={onReopen}>
              Rouvrir
            </Button>
          )}
          {isProgrammed && (
            <Button size="sm" onClick={onOpen}>
              Ouvrir maintenant
            </Button>
          )}
          {isOpen && (
            <Button variant="danger" size="sm" onClick={onClose}>
              Clôturer
            </Button>
          )}
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-5">
        {COUNTERS.map(({ key, label }) => (
          <div key={key} className="rounded-soft bg-paper px-3 py-3 text-center sm:px-4">
            <dt className="text-caption font-bold uppercase tracking-label text-muted">{label}</dt>
            <dd className="mt-1 text-2xl font-black text-ink">{counts[key]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
