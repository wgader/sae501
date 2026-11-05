import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { AssociationStatus } from '@/lib/api';

export const statusBadgeVariants = cva(
  'inline-block rounded-pill font-bold transition-colors',
  {
    variants: {
      status: {
        PENDING_VALIDATION: 'bg-accent text-ink',
        VALIDATED: 'bg-primary-soft text-primary',
        REFUSED: 'bg-danger/10 text-danger',
        SUSPENDED: 'bg-amber-100 text-amber-900',
      },
      size: {
        sm: 'px-3 py-0.5 text-xs',
        md: 'px-3.5 py-1 text-xs',
      },
    },
    defaultVariants: {
      status: 'PENDING_VALIDATION',
      size: 'sm',
    },
  },
);

export const STATUS_BADGE_DEFAULT_LABELS: Record<AssociationStatus, string> = {
  PENDING_VALIDATION: 'En attente',
  VALIDATED: 'Accepté',
  REFUSED: 'Refusé',
  SUSPENDED: 'Suspendu',
};

export interface StatusBadgeDataProps {
  status: AssociationStatus;
  label?: string;
}

export interface StatusBadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {}

export default function StatusBadge({
  status,
  label,
  size,
  className,
  children,
  ...props
}: StatusBadgeDataProps & StatusBadgeProps) {
  return (
    <span
      className={cn(statusBadgeVariants({ status, size }), className)}
      {...props}
    >
      {label || (status ? STATUS_BADGE_DEFAULT_LABELS[status] : null) || children}
    </span>
  );
}
