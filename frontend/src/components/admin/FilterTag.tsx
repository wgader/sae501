import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const filterTagVariants = cva(
  'inline-flex min-h-14 min-w-[10rem] cursor-pointer items-center justify-center whitespace-nowrap rounded-[0.63rem] px-5 sm:px-[2.19rem] py-[0.63rem] text-[0.81rem] font-extrabold uppercase leading-[1.22rem] tracking-[0.09rem] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146e67]',
  {
    variants: {
      selected: {
        true: 'bg-[#146e67] text-white',
        false: 'border border-[#146e67] text-[#146e67] hover:bg-[#E8F4F2]',
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

