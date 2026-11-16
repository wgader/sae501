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

interface CampaignRequestStatusBadgeProps {
  status: CampaignRequestStatus;
  className?: string;
}

export default function CampaignRequestStatusBadge({ status, className }: CampaignRequestStatusBadgeProps) {
  return (
    <span className={cn(campaignRequestStatusVariants({ status }), className)}>
      {CAMPAIGN_REQUEST_STATUS_LABELS[status]}
    </span>
  );
}
