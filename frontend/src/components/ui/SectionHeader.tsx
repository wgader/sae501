import type { ReactNode } from 'react';

interface SectionHeaderProps {
  id: string;
  title: string;
  description: ReactNode;
  /** Compteur, filtre ou bouton aligné à droite. */
  actions?: ReactNode;
}

/** En-tête commun aux onglets d’une fiche (Documents, Historique, Événements…). */
export default function SectionHeader({ id, title, description, actions }: SectionHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 id={id} className="text-sm font-bold uppercase tracking-wider text-ink">{title}</h2>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
