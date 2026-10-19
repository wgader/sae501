'use client';

import { useMemo, useState } from 'react';
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

export default function AdminModulePage() {
  const searchParams = useSearchParams();
  const search = searchParams.get('q') || '';
  const [page, setPage] = useState(1);
  const statusFilter: AssociationStatus = 'VALIDATED';
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedAssociation, setSelectedAssociation] = useState<Association | null>(null);

  const {
    associations,
    totalItems,
    loading,
    error,
    updatingId,
    updateStatus,
  } = useAssociations(page, statusFilter, search);

  const totalPages = Math.max(1, Math.ceil(totalItems / 10));

  async function handleStatusUpdate(association: Association, nextStatus: AssociationStatus) {
    const updated = await updateStatus(association, nextStatus);
    if (selectedAssociation?.id === association.id) {
      setSelectedAssociation(updated);
    }
  }

  function handleFilter(value: string) {
    setPage(1);
    setSelectedFilter(value);
  }

  const filteredAssociations = useMemo(() => {
    if (!selectedFilter || selectedFilter === 'all') {
      return associations;
    }
    return associations.filter((association) => {
      if (selectedFilter === 'subvention') {
        return Boolean(association.moduleSubventionActif || association.permissions?.includes('subventions'));
      }
      if (selectedFilter === 'salle') {
        return Boolean(association.moduleSalleActif || association.permissions?.includes('salles'));
      }
      if (selectedFilter === 'materiel') {
        return Boolean(association.moduleMaterielActif || association.permissions?.includes('materiel'));
      }
      return true;
    });
  }, [associations, selectedFilter]);

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
          Gestion des modules
        </h1>
      </header>

      <section className="flex w-full flex-col items-start gap-9">
        <div
          aria-label="Filtrer les associations par module"
          className="flex flex-wrap items-center gap-3"
        >
          <label htmlFor="module-filter" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <svg
              className="h-4 w-4 text-[#146e67]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filtrer par module :
          </label>
          <select
            name="module"
            id="module-filter"
            value={selectedFilter}
            onChange={(e) => handleFilter(e.target.value)}
            className="h-[40px] rounded-[10px] border border-[#146e67] bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-xs focus:border-[#146e67] focus:outline-none focus:ring-2 focus:ring-[#146e67]/20"
          >
            <option value="all">Tous les modules</option>
            <option value="subvention">Subvention</option>
            <option value="salle">Salle</option>
            <option value="materiel">Matériel</option>
          </select>
        </div>

        {error && (
          <p role="alert" className="w-full rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p role="status" className="text-sm text-[#6d746e]">Chargement des demandes…</p>
        ) : filteredAssociations.length === 0 ? (
          <p className="text-sm text-[#6d746e]">
            {search
              ? 'Aucune association ne correspond à cette recherche.'
              : selectedFilter !== 'all'
              ? 'Aucune association n’a ce module activé.'
              : 'Aucune association validée pour le moment.'}
          </p>
        ) : (
          <ul className="flex w-full max-w-[1125px] list-none flex-col gap-[25px] p-0">
            {filteredAssociations.map((association) => (
              <ItemCard
                key={association.id}
                name={association.nom}
                moduleSubventionActif={association.moduleSubventionActif}
                moduleSalleActif={association.moduleSalleActif}
                moduleMaterielActif={association.moduleMaterielActif}
                onClick={() => setSelectedAssociation(association)}
              />
            ))}
          </ul>
        )}

        {!loading && totalItems > 0 && (
          <nav aria-label="Pagination des associations" className="flex w-full max-w-[1125px] items-center justify-between text-sm text-slate-600">
            <span>{filteredAssociations.length} association{filteredAssociations.length === 1 ? '' : 's'}</span>
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
