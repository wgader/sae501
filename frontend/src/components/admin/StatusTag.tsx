import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { AssociationStatus, AssociationModule } from '@/lib/api';

export type { AssociationModule } from '@/lib/api';

export const statusTagVariants = cva(
  'inline-flex w-fit items-center rounded-full px-[0.81rem] py-[0.44rem] text-[0.63rem] font-bold uppercase leading-normal tracking-[0.11rem]',
  {
    variants: {
      status: {
        PENDING_VALIDATION: 'bg-[#9c7a19] text-white',
        VALIDATED: 'bg-Mosaic-Tile text-white',
        REFUSED: 'bg-Flush-Mahogany text-white',
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

