'use client';

import { useCallback, useEffect, useState } from 'react';
import { getRoomAvailability } from '@/lib/api/rooms';
import type { PublicRoom } from '@/lib/api/types';
import { roomSlotInstant } from '@/lib/roomFilters';
import { logger } from '@/lib/logger';

export interface RoomSlot {
  startDay: string;
  endDay: string;
  startTime: string;
  endTime: string;
}

interface AvailabilityResult {
  key: string;
  availableRoomIds: ReadonlySet<number> | null;
}

/**
 * Salles libres sur un créneau, pour les réservations ponctuelles (premier arrivé, premier servi).
 * Sans créneau (`null`), rien n'est vérifié et toutes les salles restent proposées.
 */
export function useRoomSlotAvailability(rooms: PublicRoom[], slot: RoomSlot | null) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<AvailabilityResult | null>(null);

  const start = slot ? roomSlotInstant(slot.startDay, slot.startTime) : null;
  const end = slot ? roomSlotInstant(slot.endDay, slot.endTime) : null;
  const key = start && end && rooms.length > 0
    ? `${start}|${end}|${rooms.map((room) => room.id).join(',')}|${version}`
    : null;

  useEffect(() => {
    if (!key || !start || !end) return;

    let active = true;

    Promise.all(rooms.map((room) => getRoomAvailability(room.id, start, end)))
      .then((responses) => {
        if (!active) return;
        const free = rooms.filter((_, index) => responses[index].occupiedSlots.length === 0);
        setResult({ key, availableRoomIds: new Set(free.map((room) => room.id)) });
      })
      .catch((err: unknown) => {
        logger.error('Vérification des disponibilités impossible', err);
        if (active) setResult({ key, availableRoomIds: null });
      });

    return () => {
      active = false;
    };
  }, [key, rooms, start, end]);

  const refresh = useCallback(() => setVersion((current) => current + 1), []);
  const isCurrent = key !== null && result?.key === key;

  return {
    availableRoomIds: isCurrent ? result.availableRoomIds : null,
    loading: key !== null && !isCurrent,
    failed: isCurrent && result.availableRoomIds === null,
    refresh,
  };
}
