'use client';

import { useEffect, useState } from 'react';
import { getEquipmentAvailability } from '@/lib/api/materiel';
import { logger } from '@/lib/logger';

interface StockResult {
  key: string;
  available: number | null;
}

/** Unités encore disponibles sur une période ; sans période, rien n'est vérifié. */
export function useEquipmentPeriodStock(equipmentId: number, start: string | null, end: string | null, version: number) {
  const [result, setResult] = useState<StockResult | null>(null);
  const key = start && end ? `${equipmentId}|${start}|${end}|${version}` : null;

  useEffect(() => {
    if (!key || !start || !end) return;

    let active = true;
    getEquipmentAvailability(start, end)
      .then((response) => {
        if (!active) return;
        const item = response.items.find((candidate) => candidate.id === equipmentId);
        setResult({ key, available: item?.stockDisponible ?? 0 });
      })
      .catch((err: unknown) => {
        logger.error('Vérification du stock impossible', err);
        if (active) setResult({ key, available: null });
      });
    return () => {
      active = false;
    };
  }, [key, equipmentId, start, end]);

  const isCurrent = key !== null && result?.key === key;

  return {
    available: isCurrent ? result.available : null,
    loading: key !== null && !isCurrent,
    failed: isCurrent && result.available === null,
  };
}
