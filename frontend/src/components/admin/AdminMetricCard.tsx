import { ReactNode } from 'react';
import Link from 'next/link';

interface AdminMetricCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: ReactNode;
  iconBgClass?: string;
  actionHref: string;
  actionLabel: string;
  loading?: boolean;
}

export default function AdminMetricCard({
  title,
  value,
  description,
  icon,
  iconBgClass = 'bg-accent text-ink',
  actionHref,
  actionLabel,
  loading = false,
}: AdminMetricCardProps) {
  return (
    <article className="flex h-full flex-col justify-between rounded-card border border-line bg-paper p-6 transition-shadow hover:shadow-md">
      <header>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBgClass}`}>
          {icon}
        </span>
        <p className="mt-4 text-3xl font-black text-ink">
          {loading ? (
            <span className="inline-block h-8 w-12 animate-pulse rounded bg-line" />
          ) : (
            value
          )}
        </p>
        <h3 className="mt-1 text-sm font-bold text-ink">{title}</h3>
        <p className="mt-1 text-xs text-muted">{description}</p>
      </header>

      <footer className="mt-5 border-t border-line pt-3">
        <Link
          href={actionHref}
          className="group inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary hover:underline"
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
