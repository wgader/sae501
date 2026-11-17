import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const filterTagVariants = cva(
  'inline-flex min-h-14 min-w-40 cursor-pointer items-center justify-center whitespace-nowrap rounded-control px-5 py-2.5 text-body-sm font-extrabold uppercase leading-5 tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-9',
  {
    variants: {
      selected: {
        true: 'bg-primary text-white',
        false: 'border border-primary text-primary hover:bg-primary-soft',
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

export interface FilterTagDataProps {
  label: string;
}

export interface FilterTagProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'>,
    VariantProps<typeof filterTagVariants> {
  isSelected?: boolean;
}

export default function FilterTag({
  label,
  isSelected = false,
  className,
  ...props
}: FilterTagDataProps & FilterTagProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      className={cn(filterTagVariants({ selected: isSelected }), className)}
      {...props}
    >
      {label}
    </button>
  );
}
