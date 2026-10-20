import type { HTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const adminMetricCardVariants = cva(
  'flex h-full flex-col justify-between rounded-[1.25rem] border border-[var(--line)] bg-[var(--paper)] p-6 transition-shadow hover:shadow-md',
);

export interface AdminMetricCardDataProps {
  title: string;
  value: number | string;
  description: string;
  icon: ReactNode;
  actionHref: string;
  actionLabel: string;
}

export interface AdminMetricCardProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof adminMetricCardVariants> {
  iconBgClass?: string;
  loading?: boolean;
}

export default function AdminMetricCard({
  title,
  value,
  description,
  icon,
  iconBgClass = 'bg-[var(--Lime-Cream)] text-[var(--ink)]',
  actionHref,
  actionLabel,
  loading = false,
  className,
  ...props
}: AdminMetricCardDataProps & AdminMetricCardProps) {
  return (
    <article className={cn(adminMetricCardVariants(), className)} {...props}>
      <header>
        <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl', iconBgClass)}>
          {icon}
        </span>
        <p className="mt-4 text-3xl font-black text-[var(--ink)]">
          {loading ? (
            <span className="inline-block h-8 w-12 animate-pulse rounded bg-[var(--line)]" />
          ) : (
            value
          )}
        </p>
        <h3 className="mt-1 text-sm font-bold text-[var(--ink)]">{title}</h3>
        <p className="mt-1 text-xs text-[var(--muted)]">{description}</p>
      </header>

      <footer className="mt-5 border-t border-[var(--line)] pt-3">
        <Link
          href={actionHref}
          className="group inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--Mosaic-Tile)] hover:underline"
        >
          <span>{actionLabel}</span>
          <svg
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </footer>
    </article>
  );
}

