'use client';

import { useCallback, useEffect, useState } from 'react';
import { getRoomAvailability } from '@/lib/api/rooms';
import { toBusyIntervals, type BusyInterval } from '@/lib/bookingAvailability';

interface OccupancyResult {
  key: string;
  busy: BusyInterval[] | null;
}

/** Créneaux déjà pris d'une salle entre deux jours, pour griser le calendrier. */
export function useRoomOccupancy(roomId: number, firstDay: string, lastDay: string) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<OccupancyResult | null>(null);
  const key = `${roomId}|${firstDay}|${lastDay}|${version}`;

  useEffect(() => {
    let active = true;
    getRoomAvailability(roomId, `${firstDay}T00:00:00`, `${lastDay}T23:59:59`)
      .then((response) => {
        if (active) setResult({ key, busy: toBusyIntervals(response.occupiedSlots ?? []) });
      })
      .catch((err: unknown) => {
        console.error('Chargement des disponibilités impossible', err);
        if (active) setResult({ key, busy: null });
      });
    return () => {
      active = false;
    };
  }, [key, roomId, firstDay, lastDay]);

  const refresh = useCallback(() => setVersion((current) => current + 1), []);
  const isCurrent = result?.key === key;

  return {
    busy: isCurrent ? result.busy : null,
    loading: !isCurrent,
    failed: isCurrent && result.busy === null,
    refresh,
  };
}
