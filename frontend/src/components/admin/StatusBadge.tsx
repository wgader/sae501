'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { AssociationStatus } from '@/lib/api';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-wider shadow-xs',
  {
    variants: {
      status: {
        PENDING_VALIDATION: 'border-[#fef08a] bg-[#fef9c3] text-[#854d0e]',
        VALIDATED: 'border-[#bbf7d0] bg-[#dcfce7] text-[#15803d]',
        REFUSED: 'border-[#fecaca] bg-[#fee2e2] text-[#b91c1c]',
      },
    },
  },
);

const STATUS_LABELS: Record<AssociationStatus, string> = {
  PENDING_VALIDATION: 'En attente',
  VALIDATED: 'Accepté',
  REFUSED: 'Refusé',
};

export interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  status: AssociationStatus;
  className?: string;
  labelOverride?: string;
}

export function StatusBadge({ status, className, labelOverride }: StatusBadgeProps) {
  const dotClassName = {
    PENDING_VALIDATION: 'bg-[#ca8a04]',
    VALIDATED: 'bg-[#16a34a]',
    REFUSED: 'bg-[#dc2626]',
  }[status];

  return (
    <span className={cn(statusBadgeVariants({ status }), className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dotClassName)} aria-hidden="true" />
      {labelOverride ?? STATUS_LABELS[status]}
    </span>
  );
}

export default StatusBadge;
