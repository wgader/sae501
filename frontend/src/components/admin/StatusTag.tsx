import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { AssociationStatus } from '@/lib/api';

const statusTagVariants = cva(
  'inline-flex w-fit items-center rounded-full px-[13px] py-[7px] text-[10px] font-bold uppercase leading-normal tracking-[1.7px] text-white',
  {
    variants: {
      status: {
        PENDING_VALIDATION: 'bg-[#9c7a19]',
        VALIDATED: 'bg-[#146e67]',
        REFUSED: 'bg-[#b54b4b]',
      },
    },
  },
);

const STATUS_LABELS: Record<AssociationStatus, string> = {
  PENDING_VALIDATION: 'En attente',
  VALIDATED: 'Accepté',
  REFUSED: 'Refusé',
};

interface StatusTagProps extends VariantProps<typeof statusTagVariants> {
  status: AssociationStatus;
  className?: string;
}

export default function StatusTag({ status, className }: StatusTagProps) {
  return <span className={cn(statusTagVariants({ status }), className)}>{STATUS_LABELS[status]}</span>;
}
