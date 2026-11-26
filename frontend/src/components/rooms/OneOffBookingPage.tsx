'use client';

import dynamic from 'next/dynamic';
import ModulePageHeader from '@/components/ui/ModulePageHeader';
import { ROOM_BOOKING_STEPS } from '@/lib/moduleGuides';
import { useEffect, useMemo, useState } from 'react';
import OneOffRoomView from '@/components/rooms/booking/OneOffRoomView';
import OneOffSearchDialog, { type OneOffSearch } from '@/components/rooms/booking/OneOffSearchDialog';
import RoomCampaignNotice from '@/components/rooms/RoomCampaignNotice';
import RoomCatalogCard from '@/components/rooms/RoomCatalogCard';
import RoomFiltersSidebar from '@/components/rooms/RoomFiltersSidebar';
import RoomMapFiltersSidebar from '@/components/rooms/RoomMapFiltersSidebar';
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
import { logger } from '@/lib/logger';

const RoomsMapView = dynamic(() => import('@/components/rooms/RoomsMapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-135 w-full items-center justify-center rounded-card border border-line bg-paper text-body-sm font-semibold text-muted">
      Chargement de la carte interactive…
    </div>
  ),
});

const EMPTY_SEARCH: OneOffSearch = { slot: EMPTY_SLOT, attendees: '' };

type CatalogViewMode = 'grid' | 'map';

/** Réservation ponctuelle : on cherche une salle (grille ou carte), puis on réserve depuis sa fiche. */
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
  const [viewMode, setViewMode] = useState<CatalogViewMode>('grid');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [chosenRoom, setChosenRoom] = useState<PublicRoom | null>(null);

  useEffect(() => {
    let active = true;
    getPublicRooms()
      .then((list) => {
        if (active) setRooms(list);
      })
      .catch((err: unknown) => {
        logger.error('Chargement du catalogue des salles impossible', err);
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

  const visibleRooms = useMemo(
    () => candidateRooms.filter((room) => matchesRoomFilters(room, filters)),
    [candidateRooms, filters],
  );

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
        <ModulePageHeader
          module="rooms"
          title="Réserver une salle"
          lead="Pour une réunion, une assemblée générale ou un évènement ponctuel. Premier arrivé, premier servi : les créneaux réguliers de la saison passent, eux, par la campagne annuelle."
          steps={ROOM_BOOKING_STEPS}
        >
          {rules && (
            <p className="mt-4 inline-flex rounded-pill bg-white/70 px-3.5 py-1.5 text-meta font-bold">
              Réservable jusqu’au {formatLongDay(rules.lastDay)}
            </p>
          )}
        </ModulePageHeader>

        {showCampaignNotice && campaignState && <RoomCampaignNotice state={campaignState} mode="one-off" />}

        {moduleForbidden && (
          <Notice tone="locked" title="Module « Salles » non activé pour votre association">
            La réservation des salles municipales n’est pas encore activée pour votre compte. Contactez la mairie pour en faire la demande.
          </Notice>
        )}

        {(rulesFailed || roomsFailed) && <Notice tone="danger">Impossible de charger les salles municipales. Veuillez réessayer.</Notice>}

        {!isClosed && (
          <>
            {/* Barre de recherche créneau + Toggle Grille / Carte */}
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

              {/* Sélecteur de vue Grille/Liste vs Carte (Scénario 4) */}
              <div
                role="group"
                aria-label="Mode d'affichage du catalogue"
                className="inline-flex self-start rounded-pill border border-line bg-paper p-1 lg:self-auto"
              >
                <button
                  type="button"
                  aria-pressed={viewMode === 'grid'}
                  onClick={() => setViewMode('grid')}
                  className={`flex cursor-pointer items-center gap-2 rounded-pill px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-ink text-white shadow-xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  <span>Grille</span>
                </button>
                <button
                  type="button"
                  aria-pressed={viewMode === 'map'}
                  onClick={() => setViewMode('map')}
                  className={`flex cursor-pointer items-center gap-2 rounded-pill px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    viewMode === 'map'
                      ? 'bg-ink text-white shadow-xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                    <line x1="8" y1="2" x2="8" y2="18" />
                    <line x1="16" y1="6" x2="16" y2="22" />
                  </svg>
                  <span>Carte</span>
                </button>
              </div>
            </div>

            {/* Disposition Filtres latéraux + Contenu principal (Grille ou Carte) */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
                <RoomFiltersSidebar
                  filters={filters}
                  onChange={setFilters}
                  totalCount={visibleRooms.length}
                />

                <section aria-labelledby="one-off-rooms-title" className="min-w-0 space-y-5">
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

                  {!isLoadingList && (
                    <>
                      {!availability.failed && visibleRooms.length === 0 ? (
                        <div className="space-y-3 rounded-card border border-dashed border-line px-6 py-12 text-center">
                          <p className="text-body-sm text-muted">
                            Aucune salle ne correspond à ces critères. Essayez d’autres dates ou retirez un filtre.
                          </p>
                          {activeFilters > 0 && (
                            <Button variant="secondary" size="sm" onClick={() => setFilters(DEFAULT_ROOM_FILTERS)}>
                              Réinitialiser les filtres
                            </Button>
                          )}
                        </div>
                      ) : (
                        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                          {visibleRooms.map((room) => (
                            <li key={room.id} className="flex">
                              <RoomCatalogCard room={room} isAvailable onReserve={chooseRoom} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </section>
              </div>
            ) : (
              <div className="space-y-4">
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

                <div className="flex flex-col gap-6 bg-white lg:flex-row lg:items-stretch">
                  <div className="lg:w-80 lg:shrink-0">
                    <RoomMapFiltersSidebar
                      filters={filters}
                      onChange={setFilters}
                      totalCount={visibleRooms.length}
                    />
                  </div>

                  <div className="min-w-0 flex-1 overflow-hidden rounded-card">
                    {isLoadingList ? (
                      <div className="flex h-144 w-full items-center justify-center bg-paper text-body-sm font-semibold text-muted lg:h-160">
                        Chargement de la carte interactive…
                      </div>
                    ) : (
                      <RoomsMapView
                        rooms={visibleRooms}
                        onSelectRoom={chooseRoom}
                        onResetFilters={() => setFilters(DEFAULT_ROOM_FILTERS)}
                        hasActiveFilters={activeFilters > 0}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {context && (
          <OneOffSearchDialog open={isSearchOpen} value={search} context={context} onApply={setSearch} onClose={() => setIsSearchOpen(false)} />
        )}
      </div>
    </main>
  );
}