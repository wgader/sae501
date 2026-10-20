'use client';

import { useState, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const categorySelectorVariants = cva(
  'flex w-full flex-col sm:flex-row overflow-hidden rounded-md border border-[#d9ded9] bg-white',
);

export const categorySelectorButtonVariants = cva(
  'flex-1 border-b sm:border-b-0 sm:border-r border-[#d9ded9] py-3 text-xs font-medium last:border-b-0 sm:last:border-r-0 transition-colors',
  {
    variants: {
      selected: {
        true: 'bg-[#0b644d] text-white',
        false: 'text-[#1e2420] hover:bg-[#f7f8f4]',
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

const DEFAULT_CATEGORIES = ['Sportive', 'Culturelle', 'Solidarité', 'Environnement', 'Autre'];

export interface CategorySelectorDataProps {
  categories?: string[];
  defaultValue?: string;
  value?: string;
  name?: string;
}

export interface CategorySelectorProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof categorySelectorVariants> {
  onSelectCategory?: (category: string) => void;
}

export default function CategorySelector({
  categories = DEFAULT_CATEGORIES,
  defaultValue = 'Sportive',
  value,
  name = 'category',
  onSelectCategory,
  className,
  ...props
}: CategorySelectorDataProps & CategorySelectorProps) {
  const [internalSelected, setInternalSelected] = useState(defaultValue);
  const selected = value !== undefined ? value : internalSelected;

  const handleSelect = (cat: string) => {
    if (value === undefined) {
      setInternalSelected(cat);
    }
    onSelectCategory?.(cat);
  };

  return (
    <div className={cn(categorySelectorVariants(), className)} {...props}>
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => handleSelect(cat)}
          className={cn(categorySelectorButtonVariants({ selected: selected === cat }))}
        >
          {cat}
        </button>
      ))}
      <input type="hidden" name={name} value={selected} required />
    </div>
  );
}