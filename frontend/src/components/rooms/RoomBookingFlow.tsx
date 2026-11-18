'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Notice from '@/components/ui/Notice';
import { IconArrowLeft, IconArrowRight, IconCampagne } from '@/components/ui/icons';
import RoomBookingDetailView from '@/components/rooms/RoomBookingDetailView';
import RoomCatalogCard from '@/components/rooms/RoomCatalogCard';
import RoomFiltersDialog from '@/components/rooms/RoomFiltersDialog';
import RoomSlotModal from '@/components/rooms/RoomSlotModal';
import { todayKey } from '@/lib/campaignPlanning';
import {
  DEFAULT_ROOM_FILTERS,
  countActiveRoomFilters,
  matchesRoomFilters,
} from '@/lib/roomFilters';
import { OccupiedSlot, PublicRoom, getPublicRooms, getRoomAvailability } from '@/lib/api';
import type { Campaign } from '@/lib/api/types';
import { readSession } from '@/lib/session';

type Step = 'slot' | 'rooms' | 'booking';

const dateTitleFormatter = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Le module salles est-il désactivé pour l'association (profil de session) ? */
function readModuleForbidden(): boolean {
  return readSession()?.user.modules?.salles === false;
}

function toLocalDate(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

interface RoomBookingFlowProps {
  /** Campagne ouverte : chaque demande lui est rattachée. */
  campaign: Campaign;
  /** Faux lorsque le dépôt des demandes est fermé. */
  enabled: boolean;
  /** Appelé après l'enregistrement d'une demande, pour rafraîchir les listes de la page. */
  onCreated?: () => void;
}

/**
 * Demande de campagne en trois étapes : choix du créneau, choix de la salle, puis formulaire.
 * Toutes les salles restent proposées : la mairie arbitre les demandes concurrentes.
 */
export default function RoomBookingFlow({ campaign, enabled, onCreated }: RoomBookingFlowProps) {
  const periodStart = campaign.periodStart?.slice(0, 10) ?? null;
  const periodEnd = campaign.periodEnd?.slice(0, 10) ?? null;
  const today = todayKey();
  const minDay = periodStart && periodStart > today ? periodStart : today;

  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('slot');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => toLocalDate(minDay));
  const [startHour, setStartHour] = useState('09:00');
  const [endHour, setEndHour] = useState('12:00');
  const [attendees, setAttendees] = useState<number | ''>('');
  const [chosenRoom, setChosenRoom] = useState<PublicRoom | null>(null);
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [roomFilters, setRoomFilters] = useState(DEFAULT_ROOM_FILTERS);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [moduleForbidden] = useState(readModuleForbidden);

  useEffect(() => {
    let active = true;
    getPublicRooms()
      .then((list) => {
        if (active) setRooms(list);
      })
      .catch((err: unknown) => {
        console.error('Chargement du catalogue des salles impossible', err);
        if (active) setError('Impossible de charger le catalogue des salles municipales.');
      })
      .finally(() => {
        if (active) setLoadingRooms(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const fetchAvailability = useCallback(async (room: PublicRoom) => {
    try {
      const response = await getRoomAvailability(room.id);
      setOccupiedSlots(response.occupiedSlots ?? []);
    } catch (err: unknown) {
      console.error('Chargement des disponibilités impossible', err);
    }
  }, []);

  // Salles compatibles avec l'effectif et la recherche, avant les filtres facultatifs.
  const candidateRooms = useMemo(() => {
    const query = searchFilter.trim().toLowerCase();
    return rooms.filter((room) => {
      const matchesQuery =
        !query ||
        room.nom.toLowerCase().includes(query) ||
        (room.description?.toLowerCase().includes(query) ?? false) ||
        room.adresse.toLowerCase().includes(query) ||
        room.equipementsInclus.some((equipment) => equipment.toLowerCase().includes(query));
      const fitsAttendees = attendees === '' || room.capaciteMax >= attendees;
      return matchesQuery && fitsAttendees;
    });
  }, [rooms, searchFilter, attendees]);

  const filteredRooms = useMemo(
    () => candidateRooms.filter((room) => matchesRoomFilters(room, roomFilters)),
    [candidateRooms, roomFilters],
  );

  const canBook = enabled && !moduleForbidden;

  const handleValidateSlot = (date: Date, start: string, end: string, people?: number | '') => {
    setSelectedDate(date);
    setStartHour(start);
    setEndHour(end);
    if (people !== undefined) setAttendees(people);
    setStep('rooms');
  };

  const chooseRoom = (room: PublicRoom) => {
    setChosenRoom(room);
    setOccupiedSlots([]);
    void fetchAvailability(room);
    setStep('booking');
  };

  const roomCountLabel = `${filteredRooms.length} salle${filteredRooms.length > 1 ? 's' : ''}`;
  const activeFilterCount = countActiveRoomFilters(roomFilters);
  const filterButtonLabel = activeFilterCount > 0 ? `Filtres (${activeFilterCount})` : 'Filtres';

  return (
    <div className="space-y-8">
      {moduleForbidden && (
        <Notice tone="locked" title="Module « Salles » non activé pour votre association">
          La réservation des salles municipales n’est pas encore activée pour votre compte. Contactez la mairie pour en
          faire la demande.
        </Notice>
      )}

      {error && <Notice tone="danger">{error}</Notice>}

      {step === 'slot' && (
        <section aria-labelledby="booking-slot-title" className="rounded-card border border-line bg-white p-6 sm:p-8">
          <div className="mx-auto flex max-w-lg flex-col items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-primary-soft text-primary">
              <IconCampagne className="h-6 w-6" />
            </span>
            <h2 id="booking-slot-title" className="mt-4 text-xl font-black text-ink">
              Quand avez-vous besoin d’une salle ?
            </h2>
            <p className="mt-2 text-body-sm text-muted">
              Choisissez le jour, l’horaire et l’effectif : nous vous proposerons ensuite les salles adaptées.
            </p>
            <Button
              className="mt-6"
              disabled={!canBook}
              rightIcon={<IconArrowRight className="h-4 w-4" />}
              onClick={() => setIsModalOpen(true)}
            >
              Choisir un créneau
            </Button>
          </div>
        </section>
      )}

      {step === 'rooms' && (
        <section aria-labelledby="booking-rooms-title" className="space-y-6">
          <header className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <button
                type="button"
                onClick={() => setStep('slot')}
                className="inline-flex items-center gap-1.5 text-meta font-bold uppercase tracking-label text-muted hover:text-ink cursor-pointer"
              >
                <IconArrowLeft />
                Retour
              </button>
              <p className="mt-3 text-label font-bold uppercase tracking-label text-primary">
                De {startHour} à {endHour}
              </p>
              <h2 id="booking-rooms-title" className="mt-1 text-2xl font-black text-ink first-letter:uppercase sm:text-3xl">
                {dateTitleFormatter.format(selectedDate)}
              </h2>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)}>
              Modifier le créneau
            </Button>
          </header>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full items-center gap-3 sm:max-w-xl">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Rechercher une salle ou un équipement</span>
                <input
                  type="search"
                  placeholder="Rechercher une salle ou un équipement"
                  value={searchFilter}
                  onChange={(event) => setSearchFilter(event.target.value)}
                  className="w-full rounded-control border border-line bg-white px-4 py-3 text-body-sm text-ink placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
                />
              </label>
              <Button variant="secondary" onClick={() => setIsFiltersOpen(true)}>
                {filterButtonLabel}
              </Button>
            </div>
            <p role="status" className="text-body-sm font-bold text-ink">
              {roomCountLabel}
            </p>
          </div>

          {loadingRooms && (
            <p role="status" className="py-16 text-center text-body-sm text-muted">
              Chargement des salles…
            </p>
          )}
          {!loadingRooms && filteredRooms.length === 0 && (
            <p className="rounded-card border border-dashed border-line px-6 py-12 text-center text-body-sm text-muted">
              Aucune salle ne correspond à votre recherche.
            </p>
          )}
          {!loadingRooms && filteredRooms.length > 0 && (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRooms.map((room) => (
                <li key={room.id} className="flex">
                  <RoomCatalogCard room={room} isAvailable onReserve={chooseRoom} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {step === 'booking' && chosenRoom && (
        <RoomBookingDetailView
          room={chosenRoom}
          selectedDate={selectedDate}
          startHour={startHour}
          endHour={endHour}
          initialAttendees={attendees}
          occupiedSlots={occupiedSlots}
          campaignId={campaign.id}
          onBack={() => setStep('rooms')}
          onRefreshCalendar={() => void fetchAvailability(chosenRoom)}
          onReservationCreated={(slot) => {
            setOccupiedSlots((previous) => [...previous, slot]);
            onCreated?.();
          }}
        />
      )}

      <RoomSlotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialDate={selectedDate}
        initialStartHour={startHour}
        initialEndHour={endHour}
        initialAttendees={attendees}
        minDay={minDay}
        maxDay={periodEnd}
        onValidateSlot={handleValidateSlot}
      />

      <RoomFiltersDialog
        open={isFiltersOpen}
        rooms={candidateRooms}
        filters={roomFilters}
        onApply={setRoomFilters}
        onClose={() => setIsFiltersOpen(false)}
      />
    </div>
  );
}
