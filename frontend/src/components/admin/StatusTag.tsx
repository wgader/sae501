import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { AssociationStatus, AssociationModule } from '@/lib/api';

export type { AssociationModule } from '@/lib/api';

export const statusTagVariants = cva(
  'inline-flex w-fit items-center rounded-full px-3 py-2 text-caption font-bold uppercase leading-normal tracking-widest',
  {
    variants: {
      status: {
        PENDING_VALIDATION: 'bg-ochre text-white',
        VALIDATED: 'bg-Mosaic-Tile text-white',
        REFUSED: 'bg-Flush-Mahogany text-white',
        SUSPENDED: 'bg-Flush-Mahogany text-white',
        evenements: 'bg-sand text-ink',
        salles: 'bg-Mosaic-Tile text-white',
        subventions: 'bg-Misty-Rose text-ink',
        materiel: 'bg-Indigo-Bloom text-white',
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
  evenements: 'Événement',
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
