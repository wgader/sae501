import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { RequestType } from '@/lib/api';

export const requestTypeBadgeVariants = cva(
  'inline-flex items-center gap-1.5 font-bold uppercase tracking-label rounded-soft px-2.5 py-1 text-caption transition-colors',
  {
    variants: {
      type: {
        subvention: 'bg-rose-100 text-rose-900 border border-rose-200',
        materiel: 'bg-indigo/10 text-indigo border border-indigo/20',
        salle: 'bg-accent text-ink border border-accent/40',
      },
    },
    defaultVariants: {
      type: 'subvention',
    },
  },
);

export interface RequestTypeBadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof requestTypeBadgeVariants> {
  requestType: RequestType;
  label?: string;
}

export default function RequestTypeBadge({
  requestType,
  label,
  className,
  ...props
}: RequestTypeBadgeProps) {
  const displayLabel =
    label ||
    (requestType === 'subvention'
      ? 'Subvention'
      : requestType === 'materiel'
        ? 'Matériel'
        : 'Salle municipale');

  return (
    <span
      className={cn(requestTypeBadgeVariants({ type: requestType }), className)}
      {...props}
    >
      {requestType === 'subvention' && (
        <svg
          className="h-3 w-3 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33"
          />
        </svg>
      )}

      {requestType === 'materiel' && (
        <svg
          className="h-3 w-3 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      )}

      {requestType === 'salle' && (
        <svg
          className="h-3 w-3 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 21h18M3 7v14M21 7v14M6 11h3m-3 4h3m6-4h3m-3 4h3M9 3h6l1 4H8l1-4z"
          />
        </svg>
      )}

      {displayLabel}
    </span>
  );
}

