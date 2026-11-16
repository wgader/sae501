import type { ReactNode } from 'react';

export type AnnexesSummaryItem = {
  label: string;
  value: string;
};

export function AnnexesHeader({
  eyebrow,
  description,
  children,
}: {
  eyebrow: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="rounded-card bg-primary-soft px-6 py-6">
      <p className="text-label font-bold uppercase tracking-kicker text-primary">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-black tracking-title text-ink">Pièces annexes</h1>
      <p className="mt-2 text-sm text-muted">{description}</p>
      {children}
    </header>
  );
}

export function AnnexesSummary({
  title,
  subtitle,
  badge,
  items,
}: {
  title: string;
  subtitle: string;
  badge: string;
  items: AnnexesSummaryItem[];
}) {
  return (
    <section className="rounded-card border border-line bg-white p-5" aria-labelledby="annexes-summary-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="annexes-summary-title" className="text-lg font-black uppercase text-ink">{title}</h2>
          <p className="mt-1 text-xs text-muted">{subtitle}</p>
        </div>
        <span className="rounded-pill bg-accent px-3 py-1 text-xs font-bold text-ink">{badge}</span>
      </div>
      <dl className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-label font-bold uppercase tracking-label text-muted">{item.label}</dt>
            <dd className="mt-1 text-sm font-semibold text-ink">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function AnnexesNotice({
  title,
  message,
  tone = 'info',
}: {
  title: string;
  message: string;
  tone?: 'info' | 'warning';
}) {
  return (
    <section
      className={tone === 'warning'
        ? 'rounded-card border border-danger/20 bg-danger/10 p-5'
        : 'rounded-card border border-primary/20 bg-primary-soft p-5'}
      aria-live="polite"
    >
      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="mt-1 whitespace-pre-line text-xs text-muted">{message}</p>
    </section>
  );
}

export function AnnexesSharedHint({ children }: { children?: ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-xs text-muted">
      <span aria-hidden="true" className="text-lg text-primary">◎</span>
      {children ?? 'Documents partagés entre l’association et la mairie. Les pièces peuvent être ajoutées après la déclaration initiale.'}
    </p>
  );
}

export function AnnexesDocumentsHeading({
  count,
  children = 'Documents du dossier',
}: {
  count: number;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base font-black uppercase tracking-section text-ink">{children}</h2>
      <span className="text-xs text-muted">{count} document{count > 1 ? 's' : ''}</span>
    </div>
  );
}
