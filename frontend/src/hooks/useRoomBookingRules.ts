'use client';

import { useEffect, useState } from 'react';
import { getRoomBookingRules } from '@/lib/api/rooms';
import type { RoomBookingRules } from '@/lib/api/types';
import { logger } from '@/lib/logger';

/** Règles des réservations ponctuelles ; `failed` si l'API ne les a pas fournies. */
export function useRoomBookingRules() {
  const [rules, setRules] = useState<RoomBookingRules | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    getRoomBookingRules()
      .then((response) => {
        if (active) setRules(response);
      })
      .catch((err: unknown) => {
        logger.error('Chargement des règles de réservation impossible', err);
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return { rules, failed };
}
