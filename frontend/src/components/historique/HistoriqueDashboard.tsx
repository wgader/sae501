'use client';

import { useAssociationRequests } from '@/hooks/useAssociationRequests';
import RequestStatusTabs from './RequestStatusTabs';
import RequestFilterBar from './RequestFilterBar';
import RequestCard from './RequestCard';
import RequestEmptyState from './RequestEmptyState';
import RequestDetailModal from './RequestDetailModal';
import Pagination from '@/components/ui/Pagination';

export default function HistoriqueDashboard() {
  const {
    items,
    totalItems,
    totalPages,
    counts,
    page,
    setPage,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    yearFilter,
    setYearFilter,
    searchQuery,
    setSearchQuery,
    isLoading,
    error,
    refetch,
    // Detail modal
    selectedRequestId,
    selectedRequestDetail,
    isLoadingDetail,
    detailError,
    openDetail,
    closeDetail,
  } = useAssociationRequests({ limit: 8 });

  const hasActiveFilters =
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    yearFilter !== 'all' ||
    searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setYearFilter('all');
    setSearchQuery('');
  };

  const isGlobalEmpty = !isLoading && !hasActiveFilters && totalItems === 0;
  const isFilteredEmpty = !isLoading && hasActiveFilters && totalItems === 0;

  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-328 space-y-8">
        {/* Page Header */}
        <header className="border-b border-line pb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-label font-bold uppercase tracking-eyebrow text-primary">
              Espace associations · Suivi des dossiers
            </p>
            <h1 className="mt-2 text-[clamp(2rem,3.5vw,2.75rem)] font-black tracking-display text-ink">
              Mes démarches & historique
            </h1>
            <p className="mt-2 max-w-2xl text-body leading-copy text-muted">
              Suivez en temps réel l&apos;avancement de vos demandes de subvention, réservations de matériel et de salles communales.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            aria-label="Actualiser la liste des démarches"
            className="inline-flex h-11 items-center justify-center rounded-control border border-line bg-paper px-4 text-xs font-bold uppercase tracking-label text-ink transition-colors hover:bg-line/40 disabled:opacity-50 cursor-pointer"
          >
            <svg
              className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Actualiser
          </button>
        </header>

        {/* Status Tabs Navigation */}
        <section aria-label="Onglets d'état des démarches">
          <RequestStatusTabs
            activeTab={statusFilter}
            onTabChange={setStatusFilter}
            counts={counts}
          />
        </section>

        {/* Filter Bar */}
        <RequestFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          yearFilter={yearFilter}
          onYearChange={setYearFilter}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
        />

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="rounded-soft border border-danger/30 bg-danger/10 p-4 text-sm text-danger"
          >
            <p className="font-bold">Erreur de communication avec le serveur</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* Content Area */}
        <section aria-labelledby="requests-list-heading" className="space-y-4">
          <h2 id="requests-list-heading" className="sr-only">
            Liste de vos démarches administratives
          </h2>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-8 w-8 animate-spin rounded-pill border-2 border-primary border-t-transparent" />
              <p className="mt-4 text-xs font-bold uppercase tracking-label text-muted">
                Chargement des démarches...
              </p>
            </div>
          )}

          {isGlobalEmpty && <RequestEmptyState />}

          {isFilteredEmpty && (
            <RequestEmptyState
              isFiltered
              onResetFilters={handleResetFilters}
            />
          )}

          {!isLoading && items.length > 0 && (
            <div className="space-y-3">
              {items.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onSelect={(id, type) => openDetail(id, type)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={8}
              onPageChange={setPage}
            />
          )}
        </section>
      </div>

      {/* Detail Modal */}
      <RequestDetailModal
        isOpen={selectedRequestId !== null}
        onClose={closeDetail}
        detail={selectedRequestDetail}
        isLoading={isLoadingDetail}
        error={detailError}
      />
    </main>
  );
}

