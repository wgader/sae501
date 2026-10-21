import type { HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const pageTitleVariants = cva('flex items-center gap-[0.63rem]');

export const pageTitleBarVariants = cva(
  'h-[0.19rem] w-[1.88rem] rounded-full bg-[#146E67]',
);

export const pageTitleTextVariants = cva(
  'text-[0.81rem] font-bold uppercase tracking-[0.13rem] text-black',
);

export interface PageTitleDataProps {
  title: string;
}

export interface PageTitleProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageTitleVariants> {
  children?: ReactNode;
}

export default function PageTitle({
  title,
  className,
  children,
  ...props
}: PageTitleDataProps & PageTitleProps) {
  return (
    <div className={cn(pageTitleVariants(), className)} {...props}>
      <span className={cn(pageTitleBarVariants())} aria-hidden="true" />
      <p className={cn(pageTitleTextVariants())}>
        {title}
      </p>
      {children}
    </div>
  );
}

