'use client';

import { useMemo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const paginationNavVariants = cva('', {
  variants: {
    fixed: {
      true: 'fixed bottom-0 right-0 left-0 z-20 border-t border-[var(--line)] bg-[var(--White)]/95 backdrop-blur-md px-6 py-3.5 shadow-[0_-0.25rem_1rem_rgba(0,0,0,0.06)]',
      false: 'flex flex-col gap-4 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between text-xs',
    },
    withAdminSidebar: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    {
      fixed: true,
      withAdminSidebar: true,
      className: 'lg:left-[15.63rem]',
    },
  ],
  defaultVariants: {
    fixed: true,
    withAdminSidebar: true,
  },
});

export const paginationButtonVariants = cva(
  'flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition cursor-pointer',
  {
    variants: {
      isCurrent: {
        true: 'bg-[var(--Mosaic-Tile)] text-[var(--White)] shadow-xs',
        false: 'border border-[var(--line)] bg-[var(--White)] text-[var(--ink)] hover:bg-[var(--paper)]',
      },
    },
    defaultVariants: {
      isCurrent: false,
    },
  },
);

export const paginationNavBtnVariants = cva(
  'inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--White)] px-3 font-bold uppercase tracking-wider text-[var(--ink)] transition hover:bg-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer',
);

export interface PaginationDataProps {
  page: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage?: number;
  itemLabel?: string;
}

export interface PaginationProps
  extends VariantProps<typeof paginationNavVariants> {
  onPageChange: (newPage: number) => void;
  className?: string;
  fixed?: boolean;
  withAdminSidebar?: boolean;
}

export default function Pagination({
  page,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  className,
  itemLabel = 'demande',
  fixed = true,
  withAdminSidebar = true,
}: PaginationDataProps & PaginationProps) {
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

  const pluralLabel = totalItems > 1 ? `${itemLabel}s` : itemLabel;

  const content = (
    <>
      <span className="font-semibold text-[var(--muted)]">
        Affichage de <strong className="text-[var(--ink)]">{startItem}</strong> à <strong className="text-[var(--ink)]">{endItem}</strong> sur <strong className="text-[var(--ink)]">{totalItems}</strong> {pluralLabel}
      </span>

      <ul className="flex flex-wrap items-center gap-1.5 p-0 list-none">
        <li>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className={cn(paginationNavBtnVariants())}
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
              <li key={`ellipsis-${idx}`} className="flex h-9 w-6 items-center justify-center text-[var(--muted)]" aria-hidden="true">
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
                className={cn(paginationButtonVariants({ isCurrent }))}
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
            className={cn(paginationNavBtnVariants())}
          >
            <span>Suivant</span>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </li>
      </ul>
    </>
  );

  return (
    <nav
      aria-label={`Pagination des ${pluralLabel}`}
      className={cn(paginationNavVariants({ fixed, withAdminSidebar }), className)}
    >
      {fixed ? (
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs">
          {content}
        </div>
      ) : (
        content
      )}
    </nav>
  );
}

