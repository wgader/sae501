import { useCallback, useEffect, useState } from 'react';
import {
  type Association,
  type AssociationModule,
  type AssociationStatus,
  getAssociations,
  updateAssociationStatus,
} from '@/lib/api';

export function useAssociations(page: number, status: AssociationStatus | '') {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAssociations(page, status);
      setAssociations(result.items);
      setTotalItems(result.totalItems);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de charger les associations.');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    const request = window.setTimeout(() => void reload(), 0);

    return () => window.clearTimeout(request);
  }, [reload]);

  const updateStatus = useCallback(async (
    association: Association,
    nextStatus: Exclude<AssociationStatus, 'PENDING_VALIDATION'>,
    permissions: AssociationModule[],
  ) => {
    setUpdatingId(association.id);
    setError('');
    try {
      const updated = await updateAssociationStatus(association.id, nextStatus, permissions);
      setAssociations((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Impossible de modifier cette association.';
      setError(message);
      throw cause;
    } finally {
      setUpdatingId(null);
    }
  }, []);

  return { associations, totalItems, loading, error, updatingId, updateStatus, reload };
}
