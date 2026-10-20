'use client';

import { useState } from 'react';
import FilterTag from '@/components/admin/FilterTag';
import ItemCard from '@/components/admin/ItemCard';
import DemandeDetail from '@/components/admin/DemandeDetail';
import { useAssociations } from '@/hooks/useAssociations';
import type { Association, AssociationStatus } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import Pagination from '@/components/ui/Pagination';

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
      <section className="mx-auto max-w-5xl">
        <DemandeDetail
          association={selectedAssociation}
          onBack={() => setSelectedAssociation(null)}
          onUpdateStatus={handleStatusUpdate}
          isUpdating={updatingId === selectedAssociation.id}
        />
      </section>
    );
  }

  return (
    <section className="mx-auto flex max-w-5xl flex-col items-start gap-10">
        <header className="flex min-h-[30px] w-full items-center">
          <h1 className="whitespace-nowrap text-xl font-bold uppercase leading-[1.15] tracking-[3px] text-black sm:text-[26px]">
            Demandes d’inscription
          </h1>
        </header>

        <div className="flex w-full flex-col items-start gap-9">
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

          {loading && associations.length === 0 ? (
            <p role="status" className="text-sm text-[#6d746e]">Chargement des demandes…</p>
          ) : associations.length === 0 ? (
            <p className="text-sm text-[#6d746e]">
              {search ? 'Aucune demande ne correspond à cette recherche.' : 'Aucune demande pour ce statut.'}
            </p>
          ) : (
            <ul className={`flex w-full max-w-[1125px] list-none flex-col gap-[25px] p-0 transition-opacity duration-150 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
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
        </div>

        {totalItems > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={10}
            onPageChange={setPage}
            itemLabel="demande"
          />
        )}
      </section>
  );
}
