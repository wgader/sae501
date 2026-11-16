import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { CampaignRequestStatus } from '@/lib/api/types';

export const campaignRequestStatusVariants = cva(
  'inline-flex shrink-0 items-center rounded-pill px-2.5 py-0.5 text-caption font-bold uppercase tracking-label',
  {
    variants: {
      status: {
        pending: 'bg-accent text-ink',
        accepted: 'bg-primary-soft text-primary',
        refused: 'bg-danger/10 text-danger',
        closed: 'bg-paper text-muted ring-1 ring-line',
      },
    },
    defaultVariants: {
      status: 'pending',
    },
  },
);

export const CAMPAIGN_REQUEST_STATUS_LABELS: Record<CampaignRequestStatus, string> = {
  pending: 'À traiter',
  accepted: 'Acceptée',
  refused: 'Refusée',
  closed: 'Annulée',
};

/** Libellés vus par l'association, pour qui une demande « à traiter » est « en attente ». */
export const ASSOCIATION_REQUEST_STATUS_LABELS: Record<CampaignRequestStatus, string> = {
  ...CAMPAIGN_REQUEST_STATUS_LABELS,
  pending: 'En attente',
};

interface CampaignRequestStatusBadgeProps {
  status: CampaignRequestStatus;
  labels?: Record<CampaignRequestStatus, string>;
  className?: string;
}

export default function CampaignRequestStatusBadge({
  status,
  labels = CAMPAIGN_REQUEST_STATUS_LABELS,
  className,
}: CampaignRequestStatusBadgeProps) {
  return <span className={cn(campaignRequestStatusVariants({ status }), className)}>{labels[status]}</span>;
}
