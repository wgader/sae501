import type { HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const adminPanelVariants = cva(
  'rounded-card border border-line bg-white shadow-xs',
);

export interface AdminPanelProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof adminPanelVariants> {
  children: ReactNode;
}

export default function AdminPanel({
  children,
  className,
  ...props
}: AdminPanelProps) {
  return (
    <section className={cn(adminPanelVariants(), className)} {...props}>
      {children}
    </section>
  );
}
