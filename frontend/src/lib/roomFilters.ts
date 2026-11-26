import type { PublicRoom, RoomTypologie } from '@/lib/api/types';

export interface RoomFilters {
  capacityMin: number | '';
  accessible: boolean;
  typologie: RoomTypologie | 'all';
  typologies: RoomTypologie[];
  equipements: string[];
}

export const DEFAULT_ROOM_FILTERS: RoomFilters = {
  capacityMin: '',
  accessible: false,
  typologie: 'all',
  typologies: [],
  equipements: [],
};

export const ROOM_TYPOLOGIE_OPTIONS: ReadonlyArray<{ value: RoomTypologie | 'all'; label: string }> = [
  { value: 'all', label: 'Toutes les typologies' },
  { value: 'gymnase', label: 'Gymnase' },
  { value: 'salle_polyvalente', label: 'Salle polyvalente' },
  { value: 'salle_reunion', label: 'Salle de réunion' },
];

export const ROOM_EQUIPEMENT_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'videoprojecteur', label: 'Vidéoprojecteur' },
  { value: 'cuisine', label: 'Cuisine' },
  { value: 'vestiaires', label: 'Vestiaires' },
  { value: 'sonorisation', label: 'Sonorisation' },
  { value: 'parking', label: 'Parking' },
];

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_\s]+/g, '');
}

export function matchesRoomFilters(room: PublicRoom, filters: RoomFilters): boolean {
  if (filters.capacityMin !== '' && room.capaciteMax < filters.capacityMin) {
    return false;
  }

  if (filters.accessible && !room.accesPmr) {
    return false;
  }

  const roomTypologie = room.typologie ?? 'salle_polyvalente';
  if (filters.typologies.length > 0) {
    if (!filters.typologies.includes(roomTypologie)) {
      return false;
    }
  } else if (filters.typologie !== 'all' && roomTypologie !== filters.typologie) {
    return false;
  }

  if (filters.equipements.length > 0) {
    const roomTokens = (room.equipementsInclus ?? []).map(normalizeToken);
    const hasAll = filters.equipements.every((eq) => roomTokens.includes(normalizeToken(eq)));
    if (!hasAll) {
      return false;
    }
  }

  return true;
}

export function countActiveRoomFilters(filters: RoomFilters): number {
  const typologieCount =
    filters.typologies.length > 0 ? filters.typologies.length : Number(filters.typologie !== 'all');
  return (
    Number(filters.capacityMin !== '' && filters.capacityMin > 0) +
    Number(filters.accessible) +
    typologieCount +
    filters.equipements.length
  );
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