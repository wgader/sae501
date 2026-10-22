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
        <span className="inline-block text-label font-bold uppercase tracking-kicker text-primary">
          {eyebrow}
        </span>
      )}
      <h1 className="mt-2 text-2xl font-black uppercase tracking-wider text-ink sm:text-3xl">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-sm text-muted">
          {description}
        </p>
      )}
      {children}
    </header>
  );
}
