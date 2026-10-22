'use client';

import { useMemo } from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export default function Pagination({
  page,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  className = '',
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, totalItems);

  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages);
      }
    }
    return pages;
  }, [page, totalPages]);

  if (totalItems <= 0) return null;

  return (
    <nav
      aria-label="Pagination des résultats"
      className={`flex flex-col gap-4 border-t border-line pt-6 text-xs sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <span className="font-semibold text-muted">
        Affichage de <strong className="text-ink">{startItem}</strong> à <strong className="text-ink">{endItem}</strong> sur <strong className="text-ink">{totalItems}</strong> demande{totalItems > 1 ? 's' : ''}
      </span>

      <ul className="flex flex-wrap items-center gap-1.5 p-0 list-none">
        <li>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 font-bold uppercase tracking-wider text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span>Précédent</span>
          </button>
        </li>

        {pageNumbers.map((p, idx) => {
          if (typeof p === 'string') {
            return (
              <li key={`ellipsis-${idx}`} className="flex h-9 w-6 items-center justify-center text-muted" aria-hidden="true">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </li>
            );
          }

          const isCurrent = p === page;

          return (
            <li key={p}>
              <button
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition cursor-pointer ${
                  isCurrent
                    ? 'bg-primary text-white shadow-xs'
                    : 'border border-line bg-white text-ink hover:bg-paper'
                }`}
              >
                {p}
              </button>
            </li>
          );
        })}

        <li>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 font-bold uppercase tracking-wider text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            <span>Suivant</span>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </li>
      </ul>
    </nav>
  );
}
