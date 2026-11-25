'use client';

import { useEffect, useState } from 'react';
import { getScheduleHistory, type ScheduleHistory } from '@/lib/api';
import { logger } from '@/lib/logger';

/** Charge le bilan des attributions et retient l’année affichée (la plus récente par défaut). */
export function useScheduleHistory(associationId?: number) {
  const [history, setHistory] = useState<ScheduleHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    let isActive = true;
    getScheduleHistory(associationId)
      .then((data) => {
        if (!isActive) return;
        setHistory(data);
        setError('');
      })
      .catch((requestError: unknown) => {
        logger.error('Chargement de l’historique des attributions impossible', requestError);
        if (isActive) setError(requestError instanceof Error ? requestError.message : 'Impossible de charger l’historique.');
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [associationId]);

  const years = history?.years ?? [];
  const activeYear = years.find((year) => year.year === selectedYear) ?? years[0] ?? null;

  return { history, years, activeYear, setSelectedYear, isLoading, error };
}
