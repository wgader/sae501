'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AnnuaireGrid from '@/components/admin/association/AnnuaireGrid';
import AnnuaireSkeleton from '@/components/admin/association/AnnuaireSkeleton';
import Pagination from '@/components/ui/Pagination';
import { useAssociations } from '@/hooks/useAssociations';
import { IconChevronLeft } from '@/components/ui/icons';

const ITEMS_PER_PAGE = 6;

interface AssociationDirectoryContentProps {
  initialQuery: string;
}

function AssociationDirectoryContent({ initialQuery }: AssociationDirectoryContentProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [page, setPage] = useState(1);

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setPage(1);
    if (!term.trim()) {
      router.replace('/admin/association');
    }
  };

  const { associations, totalItems, loading, error } = useAssociations(
    page,
    '',
    searchTerm,
    ITEMS_PER_PAGE,
  );

  const filteredAssociations = useMemo(() => {
    if (!searchTerm.trim()) return associations;
    const lower = searchTerm.toLowerCase();

    return associations.filter((item) => {
      const matchName = item.nom.toLowerCase().includes(lower);
      const matchEmail = item.contact?.email?.toLowerCase().includes(lower) ?? false;
      const matchContact = `${item.contact?.prenom ?? ''} ${item.contact?.nom ?? ''}`.toLowerCase().includes(lower);
      return matchName || matchEmail || matchContact;
    });
  }, [associations, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const displayedCount = searchTerm.trim() ? filteredAssociations.length : totalItems;

  return (
    <AdminLayout searchTerm={searchTerm} onSearchChange={handleSearchChange}>
      <section className="space-y-8">
        <AdminPageHeader
          title="Annuaire associations"
          description="Retrouvez les associations et consultez leurs informations, demandes et documents."
        />

        <section aria-labelledby="associations-count-heading" className="space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <h2
              id="associations-count-heading"
              className="text-xl font-bold tracking-tight text-[var(--ink)] sm:text-2xl"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2 text-base font-semibold text-[var(--muted)]">
                  <svg
                    className="h-4 w-4 animate-spin text-[var(--Mosaic-Tile)]"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Recherche en cours...</span>
                </span>
              ) : searchTerm.trim() ? (
                `${displayedCount} association${displayedCount > 1 ? 's' : ''} trouvée${displayedCount > 1 ? 's' : ''} pour « ${searchTerm} »`
              ) : (
                `${displayedCount} association${displayedCount > 1 ? 's' : ''} affichée${displayedCount > 1 ? 's' : ''}`
              )}
            </h2>

            {searchTerm.trim() && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--Mosaic-Tile)] transition-colors hover:underline cursor-pointer"
              >
                <IconChevronLeft className="h-3.5 w-3.5" />
                <span>Voir toutes les associations</span>
              </button>

            )}
          </header>

          {error && (
            <p
              className="rounded-[10px] border-l-4 border-[var(--Flush-Mahogany)] bg-rose-50/70 p-4 text-xs font-semibold leading-5 text-[var(--Flush-Mahogany)]"
              role="alert"
            >
              {error}
            </p>
          )}

          <AnnuaireGrid
            associations={filteredAssociations}
            loading={loading}
            searchTerm={searchTerm}
          />
        </section>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setPage}
          itemLabel="association"
        />
      </section>
    </AdminLayout>
  );
}

function AssociationDirectoryContainer() {
  const searchParams = useSearchParams();
  const qParam = searchParams.get('q') || '';

  return <AssociationDirectoryContent key={qParam} initialQuery={qParam} />;
}

export default function AdminAssociationDirectoryPage() {
  return (
    <Suspense
      fallback={
        <AdminLayout>
          <section className="space-y-8">
            <AdminPageHeader
              title="Annuaire associations"
              description="Retrouvez les associations et consultez leurs informations, demandes et documents."
            />
            <AnnuaireSkeleton />
          </section>
        </AdminLayout>
      }
    >
      <AssociationDirectoryContainer />
    </Suspense>
  );
}
