import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface RequestFilterBarProps extends HTMLAttributes<HTMLDivElement> {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  yearFilter: string;
  onYearChange: (value: string) => void;
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
}

export default function RequestFilterBar({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeChange,
  yearFilter,
  onYearChange,
  onResetFilters,
  hasActiveFilters,
  className,
  ...props
}: RequestFilterBarProps) {
  return (
    <section
      aria-label="Filtres de recherche des démarches"
      className={cn(
        'rounded-card border border-line bg-paper p-4 sm:p-5',
        className,
      )}
      {...props}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
        {/* Search */}
        <div className="lg:col-span-6">
          <label
            htmlFor="request-search"
            className="block text-meta font-bold uppercase tracking-label text-muted"
          >
            Recherche par mot-clé
          </label>
          <div className="relative mt-1.5">
            <span
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted"
              aria-hidden="true"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              id="request-search"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Ex: subvention, barnum, gymnase..."
              className="w-full rounded-control border border-line bg-white py-2.5 pl-10 pr-9 text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Effacer la recherche"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-ink cursor-pointer"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Type Filter */}
        <div className="lg:col-span-3">
          <label
            htmlFor="request-type-select"
            className="block text-meta font-bold uppercase tracking-label text-muted"
          >
            Type de démarche
          </label>
          <select
            id="request-type-select"
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            className="mt-1.5 w-full rounded-control border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="all">Tous les types</option>
            <option value="subvention">Demandes de subvention</option>
            <option value="materiel">Réservations de matériel</option>
            <option value="salle">Réservations de salles</option>
          </select>
        </div>

        {/* Year Filter */}
        <div className="lg:col-span-3">
          <label
            htmlFor="request-year-select"
            className="block text-meta font-bold uppercase tracking-label text-muted"
          >
            Année
          </label>
          <div className="flex gap-2">
            <select
              id="request-year-select"
              value={yearFilter}
              onChange={(e) => onYearChange(e.target.value)}
              className="mt-1.5 w-full rounded-control border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="all">Toutes les années</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>

            {hasActiveFilters && onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                title="Réinitialiser les filtres"
                className="mt-1.5 inline-flex h-10 shrink-0 items-center justify-center rounded-control border border-line bg-white px-3 text-xs font-bold text-muted hover:bg-paper hover:text-ink cursor-pointer"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

