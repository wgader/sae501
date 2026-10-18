import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const filterTagVariants = cva(
  'inline-flex min-h-14 w-40 items-center justify-center whitespace-nowrap rounded-[10px] px-[35px] py-[10px] text-[13px] font-extrabold uppercase leading-[19.5px] tracking-[1.4px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146e67]',
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

export interface FilterTagProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'>,
    VariantProps<typeof filterTagVariants> {
  label: string;
  isSelected?: boolean;
}

export default function FilterTag({
  label,
  isSelected = false,
  className,
  ...props
}: FilterTagProps) {
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
