'use client';

import { useEffect, useMemo, useState } from 'react';
import OneOffRoomView from '@/components/rooms/booking/OneOffRoomView';
import OneOffSearchDialog, { type OneOffSearch } from '@/components/rooms/booking/OneOffSearchDialog';
import RoomCampaignNotice from '@/components/rooms/RoomCampaignNotice';
import RoomCatalogCard from '@/components/rooms/RoomCatalogCard';
import RoomFiltersDialog from '@/components/rooms/RoomFiltersDialog';
import Button from '@/components/ui/Button';
import Notice from '@/components/ui/Notice';
import { IconSearch } from '@/components/ui/icons';
import { useCurrentCampaign } from '@/hooks/useCurrentCampaign';
import { useRoomBookingRules } from '@/hooks/useRoomBookingRules';
import { useRoomSlotAvailability } from '@/hooks/useRoomSlotAvailability';
import { getPublicRooms } from '@/lib/api/rooms';
import type { PublicRoom } from '@/lib/api/types';
import {
  EMPTY_SLOT,
  formatLongDay,
  formatShortDay,
  formatTime,
  isSlotComplete,
  readBookingClock,
  type AvailabilityContext,
} from '@/lib/bookingAvailability';
import { DEFAULT_ROOM_FILTERS, countActiveRoomFilters, matchesRoomFilters } from '@/lib/roomFilters';
import { readSession } from '@/lib/session';

const EMPTY_SEARCH: OneOffSearch = { slot: EMPTY_SLOT, attendees: '' };

/** Réservation ponctuelle : on cherche une salle, puis on réserve depuis sa fiche. */
export default function OneOffBookingPage() {
  const campaignState = useCurrentCampaign();
  const { rules, failed: rulesFailed } = useRoomBookingRules();
  const [clock] = useState(readBookingClock);
  const [moduleForbidden] = useState(() => readSession()?.user.modules?.salles === false);

  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsFailed, setRoomsFailed] = useState(false);
  const [search, setSearch] = useState(EMPTY_SEARCH);
  const [filters, setFilters] = useState(DEFAULT_ROOM_FILTERS);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [chosenRoom, setChosenRoom] = useState<PublicRoom | null>(null);

  useEffect(() => {
    let active = true;
    getPublicRooms()
      .then((list) => {
        if (active) setRooms(list);
      })
      .catch((err: unknown) => {
        console.error('Chargement du catalogue des salles impossible', err);
        if (active) setRoomsFailed(true);
      })
      .finally(() => {
        if (active) setLoadingRooms(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const searchedSlot = isSlotComplete(search.slot) ? search.slot : null;
  const availability = useRoomSlotAvailability(rooms, searchedSlot);

  const context = useMemo<AvailabilityContext | null>(
    () => (rules ? { rules, busy: [], ...clock } : null),
    [rules, clock],
  );

  const candidateRooms = useMemo(
    () =>
      rooms.filter((room) => {
        const fitsAttendees = search.attendees === '' || room.capaciteMax >= search.attendees;
        const isFree = !searchedSlot || (availability.availableRoomIds?.has(room.id) ?? false);
        return fitsAttendees && isFree;
      }),
    [rooms, search.attendees, searchedSlot, availability.availableRoomIds],
  );
  const visibleRooms = candidateRooms.filter((room) => matchesRoomFilters(room, filters));

  const chooseRoom = (room: PublicRoom) => {
    setChosenRoom(room);
    window.scrollTo({ top: 0 });
  };

  const leaveRoom = () => {
    setChosenRoom(null);
    availability.refresh();
    window.scrollTo({ top: 0 });
  };

  if (chosenRoom && rules) {
    return (
      <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
        <div className="mx-auto max-w-328">
          <OneOffRoomView
            key={chosenRoom.id}
            room={chosenRoom}
            rules={rules}
            initialSlot={search.slot}
            initialAttendees={search.attendees}
            onBack={leaveRoom}
          />
        </div>
      </main>
    );
  }

  const isClosed = campaignState?.active === true;
  const showCampaignNotice = campaignState !== null && (campaignState.active || campaignState.campaign?.status === 'PROGRAMMED');
  const canSearch = !isClosed && !moduleForbidden && context !== null;
  const isLoadingList = loadingRooms || availability.loading;
  const plural = visibleRooms.length > 1 ? 's' : '';
  const countLabel = searchedSlot ? `${visibleRooms.length} salle${plural} libre${plural}` : `${visibleRooms.length} salle${plural}`;
  const activeFilters = countActiveRoomFilters(filters);

  const datesLabel = searchedSlot
    ? searchedSlot.startDay === searchedSlot.endDay
      ? formatShortDay(searchedSlot.startDay)
      : `${formatShortDay(searchedSlot.startDay)} → ${formatShortDay(searchedSlot.endDay)}`
    : 'Ajouter des dates';
  const timesLabel = searchedSlot ? `${formatTime(searchedSlot.startTime)} – ${formatTime(searchedSlot.endTime)}` : 'Ajouter un horaire';
  const attendeesLabel = search.attendees === '' ? 'Combien ?' : `${search.attendees} pers.`;
  const segments = [
    { label: 'Dates', value: datesLabel },
    { label: 'Horaires', value: timesLabel },
    { label: 'Personnes', value: attendeesLabel },
  ];

  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-328 space-y-8">
        <header>
          <p className="text-label font-bold uppercase tracking-eyebrow text-primary">Salles municipales</p>
          <h1 className="mt-1 text-3xl font-black tracking-display text-ink sm:text-4xl">Réserver une salle</h1>
          <p className="mt-2 max-w-2xl text-body-sm text-muted">
            Premier arrivé, premier servi : le créneau est bloqué pour votre association dès votre demande, en attendant la
            confirmation de la mairie.
            {rules && ` Réservable jusqu’au ${formatLongDay(rules.lastDay)}.`}
          </p>
        </header>

        {showCampaignNotice && campaignState && <RoomCampaignNotice state={campaignState} mode="one-off" />}

        {moduleForbidden && (
          <Notice tone="locked" title="Module « Salles » non activé pour votre association">
            La réservation des salles municipales n’est pas encore activée pour votre compte. Contactez la mairie pour en faire la demande.
          </Notice>
        )}

        {(rulesFailed || roomsFailed) && <Notice tone="danger">Impossible de charger les salles municipales. Veuillez réessayer.</Notice>}

        {!isClosed && (
          <>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <button
                type="button"
                disabled={!canSearch}
                onClick={() => setIsSearchOpen(true)}
                className="flex w-full flex-1 cursor-pointer items-center gap-2 rounded-card border border-line bg-white p-2 text-left shadow-card transition-shadow hover:shadow-panel disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-pill"
              >
                <span className="grid min-w-0 flex-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  {segments.map((segment) => (
                    <span key={segment.label} className="min-w-0 px-4 py-2 sm:px-5">
                      <span className="block text-label font-bold uppercase tracking-label text-muted">{segment.label}</span>
                      <span className="mt-0.5 block truncate text-body-sm font-bold text-ink">{segment.value}</span>
                    </span>
                  ))}
                </span>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-pill bg-primary text-white">
                  <IconSearch className="h-5 w-5" />
                  <span className="sr-only">Rechercher</span>
                </span>
              </button>
              <Button variant="secondary" onClick={() => setIsFiltersOpen(true)}>
                {activeFilters > 0 ? `Filtres (${activeFilters})` : 'Filtres'}
              </Button>
            </div>

            <section aria-labelledby="one-off-rooms-title" className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="one-off-rooms-title" role="status" className="text-lg font-black text-ink">
                  {isLoadingList ? 'Recherche des salles…' : countLabel}
                </h2>
                {searchedSlot && (
                  <button
                    type="button"
                    onClick={() => setSearch(EMPTY_SEARCH)}
                    className="cursor-pointer text-meta font-bold text-ink underline underline-offset-2 hover:text-primary"
                  >
                    Effacer la recherche
                  </button>
                )}
              </div>

              {availability.failed && (
                <Notice
                  tone="danger"
                  title="Disponibilités indisponibles"
                  action={
                    <Button variant="secondary" size="sm" onClick={availability.refresh}>
                      Réessayer
                    </Button>
                  }
                >
                  Impossible de vérifier les salles libres sur ce créneau.
                </Notice>
              )}

              {!isLoadingList && !availability.failed && visibleRooms.length === 0 && (
                <p className="rounded-card border border-dashed border-line px-6 py-12 text-center text-body-sm text-muted">
                  Aucune salle ne correspond à ces critères. Essayez d’autres dates ou retirez un filtre.
                </p>
              )}

              {!isLoadingList && visibleRooms.length > 0 && (
                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleRooms.map((room) => (
                    <li key={room.id} className="flex">
                      <RoomCatalogCard room={room} isAvailable onReserve={chooseRoom} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {context && (
          <OneOffSearchDialog open={isSearchOpen} value={search} context={context} onApply={setSearch} onClose={() => setIsSearchOpen(false)} />
        )}
        <RoomFiltersDialog
          open={isFiltersOpen}
          rooms={candidateRooms}
          filters={filters}
          onApply={setFilters}
          onClose={() => setIsFiltersOpen(false)}
        />
      </div>
    </main>
  );
}
