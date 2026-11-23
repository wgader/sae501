'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { IconDownload } from '@/components/ui/icons';
import CampaignStatusBadge from '@/components/admin/campaign/CampaignStatusBadge';
import { downloadCampaignPlanning, getCampaignHistory } from '@/lib/api/campaigns';
import { formatInstantDate } from '@/lib/campaignDates';
import type { Campaign, CampaignWithTotals } from '@/lib/api/types';
import { logger } from '@/lib/logger';

interface CampaignHistoryProps {
  /** Campagne affichée au-dessus : exclue de l'historique. */
  currentId: number | null;
  /** Recharge l'historique quand une campagne change (clôture, dates). */
  refreshKey: string;
  onSelect: (campaign: Campaign) => void;
}

/** Campagnes clôturées : dates, bilan et planning PDF, pour retrouver les saisons passées. */
export default function CampaignHistory({ currentId, refreshKey, onSelect }: CampaignHistoryProps) {
  const [campaigns, setCampaigns] = useState<CampaignWithTotals[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    getCampaignHistory()
      .then((data) => {
        if (active) setCampaigns(data);
      })
      .catch((err: unknown) => {
        logger.error('Chargement de l’historique des campagnes impossible', err);
        if (active) setError('Impossible de charger les campagnes précédentes.');
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const past = campaigns.filter((campaign) => campaign.status === 'CLOSED' && campaign.id !== currentId);

  const download = async (campaign: CampaignWithTotals) => {
    setDownloadingId(campaign.id);
    setError(null);
    try {
      await downloadCampaignPlanning(campaign, { view: 'complet', includeRefused: false });
    } catch (err) {
      logger.error('Téléchargement du planning impossible', err);
      setError('Le planning PDF n’a pas pu être téléchargé.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (past.length === 0 && !error) {
    return null;
  }

  return (
    <section aria-labelledby="campaign-history-title" className="space-y-4 border-t border-line pt-8">
      <header>
        <h2 id="campaign-history-title" className="text-lg font-black text-ink sm:text-xl">
          Campagnes précédentes
        </h2>
        <p className="mt-1 text-body-sm text-muted">Bilan et planning définitif des saisons clôturées.</p>
      </header>

      {error && (
        <p role="alert" className="rounded-soft bg-danger/10 px-4 py-3 text-body-sm font-semibold text-danger">
          {error}
        </p>
      )}

      <ul className="grid gap-3">
        {past.map((campaign) => (
          <li key={campaign.id}>
            <article
              aria-labelledby={`campaign-history-${campaign.id}`}
              className="flex flex-col gap-4 rounded-card border border-line bg-white p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 id={`campaign-history-${campaign.id}`} className="truncate text-body font-black text-ink">
                    {campaign.seasonLabel}
                  </h3>
                  <CampaignStatusBadge status={campaign.status} />
                </div>
                <p className="mt-1 text-meta text-muted">
                  Demandes du {formatInstantDate(campaign.openingAt)} au {formatInstantDate(campaign.closingAt)}
                </p>
              </div>

              <dl className="grid grid-cols-3 gap-2 text-center lg:min-w-80">
                <div className="rounded-soft bg-paper px-3 py-2">
                  <dt className="text-caption font-bold uppercase tracking-label text-muted">Demandes</dt>
                  <dd className="text-body-lg font-black text-ink">{campaign.totals.requests}</dd>
                </div>
                <div className="rounded-soft bg-paper px-3 py-2">
                  <dt className="text-caption font-bold uppercase tracking-label text-muted">Acceptées</dt>
                  <dd className="text-body-lg font-black text-ink">{campaign.totals.accepted}</dd>
                </div>
                <div className="rounded-soft bg-paper px-3 py-2">
                  <dt className="text-caption font-bold uppercase tracking-label text-muted">Salles</dt>
                  <dd className="text-body-lg font-black text-ink">{campaign.totals.rooms}</dd>
                </div>
              </dl>

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => onSelect(campaign)}>
                  Afficher
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={downloadingId === campaign.id}
                  leftIcon={<IconDownload className="h-4 w-4" />}
                  onClick={() => void download(campaign)}
                >
                  PDF
                </Button>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
