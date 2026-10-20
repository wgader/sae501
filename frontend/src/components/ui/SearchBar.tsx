'use client';

import type React from 'react';
import type { HTMLAttributes } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const searchBarVariants = cva('w-full max-w-[25rem]');

export const searchBarInputVariants = cva(
  'w-full rounded-lg border border-[#d6dbe5] bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#116c60]',
);

export interface SearchBarDataProps {
  label?: string;
  placeholder?: string;
  paramName?: string;
  defaultValue?: string;
}

export interface SearchBarProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof searchBarVariants> {
  inputClassName?: string;
}

export default function SearchBar({
  label = 'Rechercher une association',
  placeholder = 'Nom, RNA ou e-mail du contact',
  paramName = 'q',
  className,
  inputClassName,
  ...props
}: SearchBarDataProps & SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = searchParams.get(paramName) || '';

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set(paramName, term);
    } else {
      params.delete(paramName);
    }
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className={cn(searchBarVariants(), className)} {...props}>
      <label htmlFor="search-input" className="sr-only">
        {label}
      </label>
      <input
        id="search-input"
        type="search"
        value={query}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
        placeholder={placeholder}
        className={cn(searchBarInputVariants(), inputClassName)}
      />
    </div>
  );
}

