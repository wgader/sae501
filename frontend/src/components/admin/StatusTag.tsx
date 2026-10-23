import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { AssociationStatus, AssociationModule } from '@/lib/api';

export type { AssociationModule } from '@/lib/api';

export const statusTagVariants = cva(
  'inline-flex w-fit items-center rounded-pill px-3 py-1 text-caption font-bold uppercase leading-normal tracking-label',
  {
    variants: {
      status: {
        PENDING_VALIDATION: 'bg-amber-700 text-white',
        VALIDATED: 'bg-primary text-white',
        REFUSED: 'bg-danger text-white',
        SUSPENDED: 'bg-amber-600 text-white',
        salles: 'bg-primary text-white',
        subventions: 'bg-Misty-Rose text-ink',
        materiel: 'bg-indigo text-white',
      },
    },
  },
);

export type StatusTagType = AssociationStatus | AssociationModule;

export const TAG_LABELS: Record<StatusTagType, string> = {
  PENDING_VALIDATION: 'En attente',
  VALIDATED: 'Accepté',
  REFUSED: 'Refusé',
  SUSPENDED: 'Suspendu',
  salles: 'Salle',
  subventions: 'Subvention',
  materiel: 'Matériel',
};

export interface StatusTagDataProps {
  status: StatusTagType;
  label?: string;
}

export interface StatusTagProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusTagVariants> {}

export default function StatusTag({
  status,
  label,
  className,
  ...props
}: StatusTagDataProps & StatusTagProps) {
  return (
    <span className={cn(statusTagVariants({ status }), className)} {...props}>
      {label ?? TAG_LABELS[status]}
    </span>
  );
}
