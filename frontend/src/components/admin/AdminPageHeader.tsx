import type { HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const adminPageHeaderVariants = cva('');

export interface AdminPageHeaderDataProps {
  title: string;
  eyebrow?: string;
  description?: string;
}

export interface AdminPageHeaderProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof adminPageHeaderVariants> {
  children?: ReactNode;
}

export default function AdminPageHeader({
  eyebrow = 'Administration municipale · Ville de Feytiat',
  title,
  description,
  children,
  className,
  ...props
}: AdminPageHeaderDataProps & AdminPageHeaderProps) {
  return (
    <header className={cn(adminPageHeaderVariants(), className)} {...props}>
      {eyebrow && (
        <span className="inline-block text-[0.69rem] font-bold uppercase tracking-[0.2em] text-[var(--Mosaic-Tile)]">
          {eyebrow}
        </span>
      )}
      <h1 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-wider text-[var(--ink)]">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-sm text-[var(--muted)]">
          {description}
        </p>
      )}
      {children}
    </header>
  );
}

