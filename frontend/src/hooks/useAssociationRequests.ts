'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AssociationRequestSummary,
  AssociationRequestDetail,
  AssociationRequestsResponse,
  getAssociationRequests,
  getAssociationRequestDetail,
} from '@/lib/api';

export interface UseAssociationRequestsOptions {
  initialStatus?: string;
  initialType?: string;
  initialYear?: string;
  limit?: number;
}

export function useAssociationRequests(options: UseAssociationRequestsOptions = {}) {
  const [statusFilter, setStatusFilter] = useState<string>(options.initialStatus || 'all');
  const [typeFilter, setTypeFilter] = useState<string>(options.initialType || 'all');
  const [yearFilter, setYearFilter] = useState<string>(options.initialYear || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = options.limit || 8;

  const [items, setItems] = useState<AssociationRequestSummary[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [counts, setCounts] = useState<AssociationRequestsResponse['counts']>({
    all: 0,
    active: 0,
    closed: 0,
    subvention: 0,
    materiel: 0,
    salle: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Detail view state
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequestDetail, setSelectedRequestDetail] = useState<AssociationRequestDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getAssociationRequests({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        year: yearFilter !== 'all' ? yearFilter : undefined,
        search: searchQuery.trim() || undefined,
        page,
        limit,
      });

      setItems(response.items);
      setTotalItems(response.totalItems);
      setTotalPages(response.totalPages);
      setCounts(response.counts);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Impossible de récupérer la liste des démarches.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter, yearFilter, searchQuery, page, limit]);

  useEffect(() => {
    const delay = searchQuery ? 250 : 0;
    const timer = window.setTimeout(() => {
      void loadRequests();
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadRequests, searchQuery]);

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleTypeChange = (type: string) => {
    setTypeFilter(type);
    setPage(1);
  };

  const handleYearChange = (year: string) => {
    setYearFilter(year);
    setPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const openDetail = async (id: string, type?: string) => {
    setSelectedRequestId(id);
    setIsLoadingDetail(true);
    setDetailError(null);

    try {
      const detail = await getAssociationRequestDetail(id, type);
      setSelectedRequestDetail(detail);
    } catch (err) {
      setDetailError(
        err instanceof Error ? err.message : 'Impossible de charger le détail du dossier.'
      );
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setSelectedRequestId(null);
    setSelectedRequestDetail(null);
    setDetailError(null);
  };

  return {
    items,
    totalItems,
    totalPages,
    counts,
    page,
    setPage,
    statusFilter,
    setStatusFilter: handleStatusChange,
    typeFilter,
    setTypeFilter: handleTypeChange,
    yearFilter,
    setYearFilter: handleYearChange,
    searchQuery,
    setSearchQuery: handleSearchChange,
    isLoading,
    error,
    refetch: loadRequests,
    // Detail
    selectedRequestId,
    selectedRequestDetail,
    isLoadingDetail,
    detailError,
    openDetail,
    closeDetail,
  };
}
