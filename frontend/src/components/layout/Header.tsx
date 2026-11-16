import type { HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const headerVariants = cva(
  'mx-auto flex min-h-26 w-full max-w-7xl items-center justify-between px-6 py-5',
);

export interface HeaderProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof headerVariants> {
  children?: ReactNode;
}

export default function Header({ children, className, ...props }: HeaderProps) {
  return (
    <header className={cn(headerVariants(), className)} {...props}>
      <div className="flex items-center gap-2 font-bold text-base sm:text-lg" />
      {children}
    </header>
  );
}