'use client';

import { useCallback, useEffect, useState } from 'react';
import { getRoomAvailability } from '@/lib/api/rooms';
import type { PublicRoom } from '@/lib/api/types';
import { roomSlotInstant } from '@/lib/roomFilters';

export interface RoomSlot {
  day: string;
  startHour: string;
  endHour: string;
}

interface AvailabilityResult {
  key: string;
  availableRoomIds: ReadonlySet<number> | null;
}

/**
 * Salles libres sur un créneau, pour les réservations ponctuelles (premier arrivé, premier servi).
 * Sans créneau (`null`), rien n'est vérifié : en campagne, plusieurs associations peuvent demander
 * le même créneau et la mairie arbitre ensuite.
 */
export function useRoomSlotAvailability(rooms: PublicRoom[], slot: RoomSlot | null) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<AvailabilityResult | null>(null);

  const day = slot?.day ?? null;
  const startHour = slot?.startHour ?? null;
  const endHour = slot?.endHour ?? null;
  const key = day && startHour && endHour && rooms.length > 0
    ? `${day}|${startHour}|${endHour}|${rooms.map((room) => room.id).join(',')}|${version}`
    : null;

  useEffect(() => {
    if (!key || !day || !startHour || !endHour) return;

    let active = true;
    const start = roomSlotInstant(day, startHour);
    const end = roomSlotInstant(day, endHour);

    Promise.all(rooms.map((room) => getRoomAvailability(room.id, start, end)))
      .then((responses) => {
        if (!active) return;
        const free = rooms.filter((_, index) => responses[index].occupiedSlots.length === 0);
        setResult({ key, availableRoomIds: new Set(free.map((room) => room.id)) });
      })
      .catch((err: unknown) => {
        console.error('Vérification des disponibilités impossible', err);
        if (active) setResult({ key, availableRoomIds: null });
      });

    return () => {
      active = false;
    };
  }, [key, rooms, day, startHour, endHour]);

  const refresh = useCallback(() => setVersion((current) => current + 1), []);
  const isCurrent = key !== null && result?.key === key;

  return {
    availableRoomIds: isCurrent ? result.availableRoomIds : null,
    loading: key !== null && !isCurrent,
    failed: isCurrent && result.availableRoomIds === null,
    refresh,
  };
}
