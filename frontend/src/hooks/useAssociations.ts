import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type Association,
  type AssociationCounts,
  type AssociationModule,
  type AssociationStatus,
  getAssociations,
  updateAssociationStatus,
} from '@/lib/api';

export function useAssociations(page: number, status: AssociationStatus | '', search: string = '') {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [counts, setCounts] = useState<AssociationCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const hasLoadedCountsRef = useRef(false);

  const reload = useCallback(async (forceCounts = false) => {
    setLoading(true);
    setError('');
    try {
      const needCounts = forceCounts || !hasLoadedCountsRef.current;
      const result = await getAssociations(page, status, search, needCounts);
      setAssociations(result.items);
      setTotalItems(result.totalItems);
      if (result.counts) {
        setCounts(result.counts);
        hasLoadedCountsRef.current = true;
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de charger les associations.');
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    const request = window.setTimeout(() => void reload(), 0);

    return () => window.clearTimeout(request);
  }, [reload]);

  const updateStatus = useCallback(async (
    association: Association,
    nextStatus: AssociationStatus,
    permissions?: AssociationModule[],
  ) => {
    setUpdatingId(association.id);
    setError('');
    const prevStatus = association.statut;
    try {
      const updated = await updateAssociationStatus(association.id, nextStatus, permissions);
      setAssociations((current) => current.map((item) => item.id === updated.id ? updated : item));

      // Mise à jour optimiste des counts côté front
      if (prevStatus !== nextStatus) {
        setCounts((prev) => {
          if (!prev) return null;
          const keyMap: Record<string, keyof AssociationCounts> = {
            PENDING_VALIDATION: 'pending',
            VALIDATED: 'validated',
            REFUSED: 'refused',
          };
          const prevKey = keyMap[prevStatus];
          const nextKey = keyMap[nextStatus];
          const updatedCounts = { ...prev };
          if (prevKey && typeof updatedCounts[prevKey] === 'number') {
            updatedCounts[prevKey] = Math.max(0, updatedCounts[prevKey] - 1);
          }
          if (nextKey && typeof updatedCounts[nextKey] === 'number') {
            updatedCounts[nextKey] = updatedCounts[nextKey] + 1;
          }
          return updatedCounts;
        });
      }

      // Synchronisation avec les données fraîches de la BDD
      await reload(true);
      return updated;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Impossible de modifier cette association.';
      setError(message);
      throw cause;
    } finally {
      setUpdatingId(null);
    }
  }, [reload]);

  return { associations, totalItems, counts, loading, error, updatingId, updateStatus, reload };
}
