import { addDays } from '@/lib/campaignPlanning';
import type { EquipmentOccupancy, RoomBookingRules } from '@/lib/api/types';
import type { AvailabilityContext, BusyInterval } from '@/lib/bookingAvailability';
import { roomDayKey } from '@/lib/roomFilters';

const OPENING_TIME = '08:00';
const CLOSING_TIME = '19:00';

function engagedByDay(occupancy: EquipmentOccupancy): Map<string, number> {
  const engaged = new Map<string, number>();

  occupancy.reservations.forEach(({ start, end, quantite }) => {
    const lastDay = roomDayKey(new Date(end));
    for (let day = roomDayKey(new Date(start)); day <= lastDay; day = addDays(day, 1)) {
      engaged.set(day, (engaged.get(day) ?? 0) + quantite);
    }
  });

  return engaged;
}

/** Traduit le stock engagé en calendrier : jour sans stock complet, jour entamé signalé. */
export function buildEquipmentContext(
  occupancy: EquipmentOccupancy,
  clock: { today: string; nowMinutes: number },
): AvailabilityContext {
  const rules: RoomBookingRules = {
    lastDay: occupancy.lastDay,
    maxDays: occupancy.maxConsecutiveDays,
    stepMinutes: 30,
    minMinutes: 30,
    openingTime: OPENING_TIME,
    closingTime: CLOSING_TIME,
    blockedPeriods: [],
  };

  const busy: BusyInterval[] = [];
  const limitedDays = new Set<string>();
  engagedByDay(occupancy).forEach((quantity, day) => {
    if (quantity >= occupancy.stockTotal) busy.push({ start: `${day}T${OPENING_TIME}`, end: `${day}T${CLOSING_TIME}` });
    else limitedDays.add(day);
  });

  return { rules, busy, limitedDays, ...clock };
}

/** Jour et heure choisis dans le navigateur → instant envoyé à l'API. */
export function toEquipmentInstant(day: string, time: string): string {
  return new Date(`${day}T${time}:00`).toISOString();
}
