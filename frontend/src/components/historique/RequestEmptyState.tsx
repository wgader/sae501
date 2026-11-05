import Link from 'next/link';

export interface RequestEmptyStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

export default function RequestEmptyState({
  isFiltered = false,
  onResetFilters,
}: RequestEmptyStateProps) {
  if (isFiltered) {
    return (
      <div className="rounded-panel border border-line bg-paper p-8 sm:p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-paper border border-line text-muted">
          <svg
            className="h-7 w-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <h3 className="mt-5 text-lg font-bold text-ink">
          Aucun dossier trouvé
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Aucune démarche ne correspond à vos filtres actuels. Modifiez vos critères ou réinitialisez la recherche.
        </p>

        {onResetFilters && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex h-10 items-center justify-center rounded-control bg-primary px-5 text-xs font-bold uppercase tracking-label text-white hover:bg-primary-hover transition-colors cursor-pointer"
            >
              Réinitialiser les critères
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-panel border border-line bg-paper p-8 sm:p-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <svg
          className="h-8 w-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      </div>

      <h3 className="mt-6 text-xl font-black tracking-display text-ink sm:text-2xl">
        Aucune démarche enregistrée
      </h3>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted leading-relaxed">
        Votre association n&apos;a encore initié aucune requête municipale. Déposez dès maintenant un dossier de subvention, réservez une salle ou empruntez du matériel auprès de la ville de Feytiat.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/subventions"
          className="inline-flex h-11 items-center justify-center rounded-control bg-primary px-5 text-xs font-bold uppercase tracking-label text-white transition-colors hover:bg-primary-hover shadow-xs"
        >
          Demander une subvention
        </Link>
        <Link
          href="/salles"
          className="inline-flex h-11 items-center justify-center rounded-control border border-line bg-white px-5 text-xs font-bold uppercase tracking-label text-ink transition-colors hover:bg-paper"
        >
          Réserver une salle
        </Link>
        <Link
          href="/materiel"
          className="inline-flex h-11 items-center justify-center rounded-control border border-line bg-white px-5 text-xs font-bold uppercase tracking-label text-ink transition-colors hover:bg-paper"
        >
          Réserver du matériel
        </Link>
      </div>
    </div>
  );
}

