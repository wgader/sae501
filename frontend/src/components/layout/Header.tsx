import type { HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const headerVariants = cva(
  'mx-auto flex min-h-[6.5rem] w-full max-w-[90rem] items-center justify-between px-[clamp(1.25rem,3.61vw,3.25rem)] py-5',
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