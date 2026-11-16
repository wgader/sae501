import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { CampaignStatus } from '@/lib/api/types';

export const campaignStatusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-meta font-bold',
  {
    variants: {
      status: {
        ACTIVE: 'bg-primary-soft text-primary',
        PROGRAMMED: 'bg-accent text-ink',
        CLOSED: 'bg-paper text-muted ring-1 ring-line',
      },
    },
    defaultVariants: {
      status: 'PROGRAMMED',
    },
  },
);

const dotVariants = cva('h-1.5 w-1.5 rounded-pill', {
  variants: {
    status: {
      ACTIVE: 'animate-pulse bg-primary',
      PROGRAMMED: 'bg-moss',
      CLOSED: 'bg-muted',
    },
  },
});

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  ACTIVE: 'Ouverte',
  PROGRAMMED: 'Programmée',
  CLOSED: 'Clôturée',
};

interface CampaignStatusBadgeProps extends VariantProps<typeof campaignStatusBadgeVariants> {
  status: CampaignStatus;
  className?: string;
}

export default function CampaignStatusBadge({ status, className }: CampaignStatusBadgeProps) {
  return (
    <span className={cn(campaignStatusBadgeVariants({ status }), className)}>
      <span className={dotVariants({ status })} aria-hidden="true" />
      {CAMPAIGN_STATUS_LABELS[status]}
    </span>
  );
}
