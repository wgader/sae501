import { useMemo } from 'react';
import type { Campaign } from '@/lib/api/types';
import CampaignStatusBadge from './CampaignStatusBadge';

interface CampaignActiveBannerProps {
  activeCampaign: Campaign | null;
  programmedCampaign: Campaign | null;
  onOpenClick: (campaign: Campaign) => void;
  onCloseClick: (campaign: Campaign) => void;
}

export default function CampaignActiveBanner({
  activeCampaign,
  programmedCampaign,
  onOpenClick,
  onCloseClick,
}: CampaignActiveBannerProps) {
  // Calcul du temps restant avant clôture
  const remainingTimeText = useMemo(() => {
    if (!activeCampaign?.closingAt) return null;
    const now = new Date().getTime();
    const closeTime = new Date(activeCampaign.closingAt).getTime();
    const diff = closeTime - now;

    if (diff <= 0) return 'Échéance atteinte (clôture imminente)';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 1) {
      return `${days} jours et ${hours} h restants avant la clôture`;
    }
    if (days === 1) {
      return `1 jour et ${hours} h restants avant la clôture`;
    }
    return `${hours} h restantes avant la clôture`;
  }, [activeCampaign]);

  const programmedDateText = useMemo(() => {
    if (!programmedCampaign?.openingAt) return null;
    const d = new Date(programmedCampaign.openingAt);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [programmedCampaign]);

  if (activeCampaign) {
    return (
      <aside
        aria-label="Campagne active"
        className="rounded-card border border-primary/30 bg-primary-soft/40 p-5 shadow-xs"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary text-white shadow-2xs">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-body-sm font-black text-ink">
                  Guichet ouvert : {activeCampaign.seasonLabel}
                </span>
                <CampaignStatusBadge status={activeCampaign.status} />
              </div>
              <p className="mt-1 text-meta font-medium text-ink/80">
                {remainingTimeText}. Le formulaire de vœux annuels est accessible aux associations.
              </p>
            </div>
          </div>

          <div className="shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => onCloseClick(activeCampaign)}
              className="inline-flex items-center gap-2 rounded-control bg-danger px-4 py-2 text-meta font-bold text-white shadow-xs transition hover:bg-rose-700 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clôturer la campagne
            </button>
          </div>
        </div>
      </aside>
    );
  }

  if (programmedCampaign) {
    return (
      <aside
        aria-label="Campagne programmée"
        className="rounded-card border border-line bg-paper p-5 shadow-xs"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-moss text-white shadow-2xs">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-body-sm font-black text-ink">
                  Prochaine campagne : {programmedCampaign.seasonLabel}
                </span>
                <CampaignStatusBadge status={programmedCampaign.status} />
              </div>
              <p className="mt-1 text-meta font-medium text-muted">
                Ouverture planifiée le {programmedDateText}. Le guichet usager est actuellement verrouillé.
              </p>
            </div>
          </div>

          <div className="shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => onOpenClick(programmedCampaign)}
              className="inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2 text-meta font-bold text-white shadow-xs transition hover:bg-primary-hover cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ouvrir immédiatement
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return null;
}
