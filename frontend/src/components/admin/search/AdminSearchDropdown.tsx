'use client';

import { type Association } from '@/lib/api';
import { IconChevronRight, IconAssociation } from '@/components/ui/icons';

interface AdminSearchDropdownProps {
  query: string;
  loading: boolean;
  results: Association[];
  totalFound: number;
  onSelect: (id: number) => void;
  onViewAll: () => void;
}

export default function AdminSearchDropdown({
  query,
  loading,
  results,
  totalFound,
  onSelect,
  onViewAll,
}: AdminSearchDropdownProps) {
  return (
    <section
      aria-label="Suggestions de recherche"
      className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--White)] shadow-xl animate-in fade-in slide-in-from-top-1 duration-150"
    >
      {loading && results.length === 0 ? (
        <p className="p-4 text-center text-xs text-[var(--muted)]" role="status">
          Recherche en cours...
        </p>
      ) : results.length === 0 ? (
        <p className="p-4 text-center text-xs text-[var(--muted)]">
          Aucune association trouvée pour « <strong className="text-[var(--ink)]">{query}</strong> »
        </p>
      ) : (
        <>
          <header className="border-b border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--muted)]">
            Associations ({totalFound})
          </header>

          <ul className="m-0 max-h-72 divide-y divide-[var(--line)] overflow-y-auto p-0 list-none">
            {results.map((item) => {
              const contactName =
                item.contact?.nomComplet ||
                `${item.contact?.prenom ?? ''} ${item.contact?.nom ?? ''}`.trim();

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[var(--Pale-Sage)]/40 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--Pale-Sage)] text-[var(--Mosaic-Tile)]">
                        <IconAssociation className="h-4 w-4" />
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold uppercase text-[var(--ink)]">
                          {item.nom}
                        </p>
                        <p className="mt-0.5 truncate text-[0.6875rem] text-[var(--muted)]">
                          {item.categorie || 'Association'}
                          {contactName ? ` · ${contactName}` : ''}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 text-[var(--Mosaic-Tile)]">
                      <IconChevronRight className="h-4 w-4" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <footer className="border-t border-[var(--line)] bg-[var(--paper)] p-2.5 text-center">
            <button
              type="button"
              onClick={onViewAll}
              className="inline-flex w-full items-center justify-center gap-1.5 text-xs font-bold text-[var(--Mosaic-Tile)] hover:underline cursor-pointer"
            >
              <span>Voir tous les résultats pour « {query} » ({totalFound})</span>
              <IconChevronRight className="h-3 w-3" />
            </button>

          </footer>
        </>
      )}
    </section>
  );
}
