'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import FilterTag from '@/components/admin/FilterTag';
import ItemCard from '@/components/admin/ItemCard';
import ConfirmationModal, { type ModuleChangeItem } from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import { useAssociations } from '@/hooks/useAssociations';
import { useAdminSearch } from '@/app/admin/layout';
import type { Association, AssociationModule, AssociationStatus } from '@/lib/api';

type ModuleFilter = 'all' | 'subvention' | 'salle' | 'materiel';

const MODULE_FILTERS: { label: string; value: ModuleFilter }[] = [
  { label: 'TOUS LES MODULES', value: 'all' },
  { label: 'SUBVENTIONS', value: 'subvention' },
  { label: 'SALLES', value: 'salle' },
  { label: 'MATÉRIEL', value: 'materiel' },
];

interface PendingBatchChange {
  association: Association;
  newPermissions: AssociationModule[];
  changes: ModuleChangeItem[];
}

export default function AdminModulesPage() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const { searchTerm } = useAdminSearch();
  const activeSearch = (searchTerm || urlQuery).trim();

  const [page, setPage] = useState(1);
  const statusFilter: AssociationStatus = 'VALIDATED';
  const [selectedFilter, setSelectedFilter] = useState<ModuleFilter>('all');

  // Confirmation modal state
  const [pendingChange, setPendingChange] = useState<PendingBatchChange | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Hook fetching
  const {
    associations,
    totalItems,
    loading,
    error: apiError,
    updatingId,
    updateStatus,
  } = useAssociations(page, statusFilter, activeSearch);

  // Local state for optimistic updates during mutations
  const [optimisticOverrides, setOptimisticOverrides] = useState<Record<number, Partial<Association>>>({});

  // Merge server data with optimistic overrides
  const effectiveAssociations = useMemo(() => {
    return associations.map((item) => {
      const override = optimisticOverrides[item.id];
      return override ? { ...item, ...override } : item;
    });
  }, [associations, optimisticOverrides]);

  const totalPages = Math.max(1, Math.ceil(totalItems / 10));

  function handleFilterChange(filter: ModuleFilter) {
    setSelectedFilter(filter);
    setPage(1);
  }

  // Intercept module batch change request from an ItemCard
  function handleRequestSaveModules(
    association: Association,
    newPermissions: AssociationModule[],
    changes: ModuleChangeItem[],
  ) {
    if (changes.length === 0) return;
    setFeedback(null);
    setPendingChange({
      association,
      newPermissions,
      changes,
    });
  }

  // Execute the confirmed batch change: optimistic update + backend persistence
  async function handleConfirmModuleChanges() {
    if (!pendingChange) return;
    const { association, newPermissions, changes } = pendingChange;

    setIsSaving(true);
    setFeedback(null);

    const isSubventionActive = newPermissions.includes('subventions');
    const isSalleActive = newPermissions.includes('salles');
    const isMaterielActive = newPermissions.includes('materiel');

    // 1. Optimistic update directly in front-end
    setOptimisticOverrides((prev) => ({
      ...prev,
      [association.id]: {
        permissions: newPermissions,
        moduleSubventionActif: isSubventionActive,
        moduleSalleActif: isSalleActive,
        moduleMaterielActif: isMaterielActive,
      },
    }));

    // 2. Persist in database via API
    try {
      await updateStatus(association, association.statut, newPermissions);
      // Clear override since server reloaded fresh state
      setOptimisticOverrides((prev) => {
        const next = { ...prev };
        delete next[association.id];
        return next;
      });

      const summaryList = changes
        .map((c) => `« ${c.label} » (${c.nextState ? 'activé' : 'désactivé'})`)
        .join(', ');

      setFeedback({
        type: 'success',
        message: `Habilitations mises à jour pour ${association.nom} : ${summaryList}.`,
      });
      setPendingChange(null);
    } catch (err) {
      // Revert in case of API failure
      setOptimisticOverrides((prev) => {
        const next = { ...prev };
        delete next[association.id];
        return next;
      });
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de la mise à jour des modules en base de données.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  // Filter associations based on search and selected module filter
  const filteredAssociations = useMemo(() => {
    let list = effectiveAssociations;

    if (activeSearch) {
      const lower = activeSearch.toLowerCase();
      list = list.filter((item) => {
        const matchName = item.nom.toLowerCase().includes(lower);
        const matchEmail = item.contact?.email?.toLowerCase().includes(lower) ?? false;
        const matchContact = `${item.contact?.prenom ?? ''} ${item.contact?.nom ?? ''}`.toLowerCase().includes(lower);
        return matchName || matchEmail || matchContact;
      });
    }

    if (!selectedFilter || selectedFilter === 'all') {
      return list;
    }

    return list.filter((association) => {
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
  }, [effectiveAssociations, activeSearch, selectedFilter]);

  return (
    <section className="mx-auto max-w-5xl">
      <AdminPageHeader
        title="Gestion des modules"
        // description="Cliquez sur une association pour afficher et modifier ses habilitations aux modules municipaux."
        className="mb-6"
      >
        <nav aria-label="Filtres par module" className="mt-5 flex flex-wrap items-center gap-3">
          {MODULE_FILTERS.map((filter) => (
            <FilterTag
              key={filter.value}
              label={filter.label}
              isSelected={selectedFilter === filter.value}
              onClick={() => handleFilterChange(filter.value)}
            />
          ))}
        </nav>
      </AdminPageHeader>

      {/* Message de succès ou d'erreur */}
      {feedback && (
        <div
          role="alert"
          className={`mb-6 flex items-center justify-between rounded-[0.75rem] border p-4 text-xs font-semibold leading-5 ${
            feedback.type === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : 'border-[var(--Flush-Mahogany)] bg-rose-50/70 text-[var(--Flush-Mahogany)]'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="ml-4 font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
            aria-label="Fermer la notification"
          >
            ✕
          </button>
        </div>
      )}

      {apiError && (
        <p
          className="mb-6 rounded-[10px] border-l-4 border-[var(--Flush-Mahogany)] bg-rose-50/70 p-4 text-xs font-semibold leading-5 text-[var(--Flush-Mahogany)]"
          role="alert"
        >
          {apiError}
        </p>
      )}

      {loading && filteredAssociations.length === 0 ? (
        <section className="py-16 text-center text-[var(--muted)]">
          <svg className="mx-auto h-8 w-8 animate-spin text-[var(--Mosaic-Tile)]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-3 text-xs font-bold uppercase tracking-wider">Chargement des associations...</p>
        </section>
      ) : filteredAssociations.length === 0 ? (
        <section className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--paper)] py-16 text-center">
          <p className="text-base font-bold text-[var(--ink)]">Aucune association trouvée</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {activeSearch
              ? `Aucune association ne correspond à la recherche « ${activeSearch} ».`
              : selectedFilter !== 'all'
              ? 'Aucune association validée n’a ce module activé pour le moment.'
              : 'Aucune association validée pour le moment.'}
          </p>
        </section>
      ) : (
        <ul
          className={`space-y-4 p-0 list-none transition-opacity duration-150 ${
            loading ? 'opacity-50 pointer-events-none' : 'opacity-100'
          }`}
        >
          {filteredAssociations.map((association) => (
            <ItemCard
              key={`${association.id}-${(association.permissions ?? []).slice().sort().join(',')}`}
              association={association}
              name={association.nom}
              moduleSubventionActif={association.moduleSubventionActif}
              moduleSalleActif={association.moduleSalleActif}
              moduleMaterielActif={association.moduleMaterielActif}
              permissions={association.permissions}
              enableModuleEditor={true}
              isUpdating={updatingId === association.id}
              onSaveModules={(newPermissions, changes) =>
                handleRequestSaveModules(association, newPermissions, changes)
              }
            />
          ))}
        </ul>
      )}

      {totalItems > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={10}
          onPageChange={setPage}
          itemLabel="association"
        />
      )}

      {/* ── Modal de validation/confirmation ────────────────────── */}
      {pendingChange && (
        <ConfirmationModal
          isOpen={Boolean(pendingChange)}
          associationName={pendingChange.association.nom}
          changes={pendingChange.changes}
          isLoading={isSaving}
          onConfirm={handleConfirmModuleChanges}
          onClose={() => {
            if (!isSaving) setPendingChange(null);
          }}
        />
      )}
    </section>
  );
}
