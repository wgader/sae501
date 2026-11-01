import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const requestStatusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 font-bold uppercase tracking-label transition-colors',
  {
    variants: {
      status: {
        active: 'bg-primary-soft text-primary border border-primary/20',
        pending: 'bg-amber-100 text-amber-900 border border-amber-200',
        actionRequired: 'bg-orange-100 text-orange-900 border border-orange-200',
        validated: 'bg-primary-soft text-primary border border-primary/25',
        refused: 'bg-danger/10 text-danger border border-danger/25',
        closed: 'bg-paper text-muted border border-line',
        returned: 'bg-indigo/10 text-indigo border border-indigo/25',
      },
      size: {
        sm: 'rounded-soft px-2.5 py-0.5 text-caption',
        md: 'rounded-control px-3.5 py-1 text-meta',
      },
    },
    defaultVariants: {
      status: 'pending',
      size: 'sm',
    },
  },
);

export function mapStatusToVariant(
  statusString: string,
): NonNullable<VariantProps<typeof requestStatusBadgeVariants>['status']> {
  const norm = statusString.trim().toLowerCase();

  if (norm.includes('complément') || norm.includes('complement')) {
    return 'actionRequired';
  }
  if (norm.includes('valid')) {
    return 'validated';
  }
  if (norm.includes('refus')) {
    return 'refused';
  }
  if (norm.includes('restitu')) {
    return 'returned';
  }
  if (norm.includes('clôtur') || norm.includes('clotur')) {
    return 'closed';
  }
  if (norm.includes('cours')) {
    return 'active';
  }

  return 'pending';
}

export interface RequestStatusBadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof requestStatusBadgeVariants> {
  statusLabel: string;
}

export default function RequestStatusBadge({
  statusLabel,
  status,
  size,
  className,
  ...props
}: RequestStatusBadgeProps) {
  const resolvedStatus = status || mapStatusToVariant(statusLabel);

  return (
    <span
      className={cn(requestStatusBadgeVariants({ status: resolvedStatus, size }), className)}
      {...props}
    >
      <span
        className="h-1.5 w-1.5 rounded-pill bg-current opacity-80"
        aria-hidden="true"
      />
      {statusLabel}
    </span>
  );
}

