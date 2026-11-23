'use client';

import { useCallback, useEffect, useState } from 'react';
import { getEquipmentOccupancy } from '@/lib/api/materiel';
import type { EquipmentOccupancy } from '@/lib/api/types';

interface OccupancyResult {
  key: string;
  occupancy: EquipmentOccupancy | null;
}

/** Stock engagé et limites d'un équipement ; `refresh` recharge après un conflit. */
export function useEquipmentOccupancy(equipmentId: number) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<OccupancyResult | null>(null);
  const key = `${equipmentId}|${version}`;

  useEffect(() => {
    let active = true;
    getEquipmentOccupancy(equipmentId)
      .then((occupancy) => {
        if (active) setResult({ key, occupancy });
      })
      .catch((err: unknown) => {
        console.error('Chargement du calendrier du matériel impossible', err);
        if (active) setResult({ key, occupancy: null });
      });
    return () => {
      active = false;
    };
  }, [key, equipmentId]);

  const refresh = useCallback(() => setVersion((current) => current + 1), []);
  const isCurrent = result?.key === key;

  return {
    occupancy: result?.occupancy ?? null,
    loading: !isCurrent,
    failed: isCurrent && result.occupancy === null,
    refresh,
  };
}
