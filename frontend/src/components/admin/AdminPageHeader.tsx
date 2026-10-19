import { ReactNode } from 'react';

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export default function AdminPageHeader({
  eyebrow = 'Administration municipale · Ville de Feytiat',
  title,
  description,
  children,
  className = '',
}: AdminPageHeaderProps) {
  return (
    <header className={className}>
      {eyebrow && (
        <span className="inline-block text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-[var(--Mosaic-Tile)]">
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
