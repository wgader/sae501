import type { PublicRoom } from '@/lib/api/types';

export type RoomCapacityFilter = 'all' | 'under20' | 'under50';

export interface RoomFilters {
  capacity: RoomCapacityFilter;
  accessible: boolean;
}

export const DEFAULT_ROOM_FILTERS: RoomFilters = { capacity: 'all', accessible: false };

export const ROOM_CAPACITY_OPTIONS: ReadonlyArray<{ value: RoomCapacityFilter; label: string }> = [
  { value: 'all', label: 'Toutes les capacités' },
  { value: 'under20', label: 'Moins de 20 personnes' },
  { value: 'under50', label: 'Moins de 50 personnes' },
];

export function matchesRoomFilters(room: PublicRoom, filters: RoomFilters): boolean {
  const matchesCapacity =
    filters.capacity === 'all' ||
    (filters.capacity === 'under20' && room.capaciteMax < 20) ||
    (filters.capacity === 'under50' && room.capaciteMax < 50);

  return matchesCapacity && (!filters.accessible || room.accesPmr);
}

export function countActiveRoomFilters(filters: RoomFilters): number {
  return Number(filters.capacity !== 'all') + Number(filters.accessible);
}

/** Jour local au format AAAA-MM-JJ, sans passer par UTC. */
export function roomDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Horodatage d'un créneau, identique à l'envoi de la demande pour comparer les mêmes heures. */
export function roomSlotInstant(day: string, hour: string): string {
  return `${day}T${hour}:00+01:00`;
}
