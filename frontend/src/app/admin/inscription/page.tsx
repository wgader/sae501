'use client';

import { useState } from 'react';
import FilterTag from '@/components/admin/FilterTag';
import ItemCard from '@/components/admin/ItemCard';
import DemandeDetail from '@/components/admin/DemandeDetail';
import { useAssociations } from '@/hooks/useAssociations';
import type { Association, AssociationStatus } from '@/lib/api';
import { useSearchParams } from 'next/navigation';

const statusFilters: Array<{ id: AssociationStatus; label: string }> = [
  { id: 'PENDING_VALIDATION', label: 'En attente' },
  { id: 'VALIDATED', label: 'Accepté' },
  { id: 'REFUSED', label: 'Refusé' },
];

export default function AdminSignupManager() {
  const searchParams = useSearchParams();
  const search = searchParams.get('q') || '';
  const [page, setPage] = useState(1);
  const [selectedFilter, setSelectedFilter] = useState<AssociationStatus>('PENDING_VALIDATION');
  const [selectedAssociation, setSelectedAssociation] = useState<Association | null>(null);

  const {
    associations,
    totalItems,
    loading,
    error,
    updatingId,
    updateStatus,
  } = useAssociations(page, selectedFilter, search);

  const totalPages = Math.max(1, Math.ceil(totalItems / 10));

  async function handleStatusUpdate(association: Association, nextStatus: AssociationStatus) {
    const updated = await updateStatus(association, nextStatus);
    if (selectedAssociation?.id === association.id) {
      setSelectedAssociation(updated);
    }
  }

  if (selectedAssociation) {
    return (
      <main className="min-h-screen bg-white p-5 sm:p-8">
        <DemandeDetail
          association={selectedAssociation}
          onBack={() => setSelectedAssociation(null)}
          onUpdateStatus={handleStatusUpdate}
          isUpdating={updatingId === selectedAssociation.id}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-start gap-16 rounded-[10px] bg-white p-5 backdrop-blur-[2px]">
      <header className="flex min-h-[30px] w-full items-center px-px">
        <h1 className="whitespace-nowrap text-xl font-bold uppercase leading-[1.15] tracking-[3px] text-black sm:text-[26px]">
          Demandes d’inscription
        </h1>
      </header>

      <section className="flex w-full flex-col items-start gap-9">
        <div
          aria-label="Filtrer les demandes par statut"
          role="group"
          className="flex w-full flex-wrap items-center gap-[23px]"
        >
          {statusFilters.map((filter) => (
            <FilterTag
              key={filter.id}
              label={filter.label}
              isSelected={selectedFilter === filter.id}
              onClick={() => {
                setSelectedFilter(filter.id);
                setPage(1);
              }}
            />
          ))}
        </div>

        {error && (
          <p role="alert" className="w-full rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p role="status" className="text-sm text-[#6d746e]">Chargement des demandes…</p>
        ) : associations.length === 0 ? (
          <p className="text-sm text-[#6d746e]">
            {search ? 'Aucune demande ne correspond à cette recherche.' : 'Aucune demande pour ce statut.'}
          </p>
        ) : (
          <ul className="flex w-full max-w-[1125px] list-none flex-col gap-[25px] p-0">
            {associations.map((association) => (
              <ItemCard
                key={association.id}
                name={association.nom}
                status={association.statut}
                onClick={() => setSelectedAssociation(association)}
              />
            ))}
          </ul>
        )}

        {!loading && totalItems > 0 && (
          <nav aria-label="Pagination des demandes" className="flex w-full max-w-[1125px] items-center justify-between text-sm text-slate-600">
            <span>{totalItems} demande{totalItems === 1 ? '' : 's'}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-[#146e67] px-3 py-2 text-xs font-bold text-[#146e67] hover:bg-[#E8F4F2] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Précédent
              </button>
              <span>Page {page} sur {totalPages}</span>
              <button
                type="button"
                className="rounded-lg border border-[#146e67] px-3 py-2 text-xs font-bold text-[#146e67] hover:bg-[#E8F4F2] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Suivant
              </button>
            </div>
          </nav>
        )}
      </section>
    </main>
  );
}
