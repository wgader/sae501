'use client';

import { useEffect, useMemo, useState } from 'react';
import RoomBookingDetailView from '@/components/rooms/RoomBookingDetailView';
import RoomCatalogCard from '@/components/rooms/RoomCatalogCard';
import RoomSlotModal from '@/components/rooms/RoomSlotModal';
import RoomFiltersAside, {
  matchesRoomFilters,
  type RoomFilters,
} from '@/components/rooms/RoomFiltersAside';
import {
  OccupiedSlot,
  PublicRoom,
  getPublicRooms,
  getRoomAvailability,
} from '@/lib/api';

function formatDateDisplay(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDateTitle(d: Date): string {
  const dayNames = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
  const monthNames = [
    'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
    'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE',
  ];
  return `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateRange(startDate: Date, endDate: Date): string {
  return startDate.getTime() === endDate.getTime()
    ? formatDateTitle(startDate)
    : `Du ${formatDateTitle(startDate)} au ${formatDateTitle(endDate)}`;
}

function formatSlotDateTime(date: Date, hour: string): string {
  const [hours, minutes] = hour.split(':').map(Number);
  const dateTime = new Date(date);
  dateTime.setHours(hours, minutes, 0, 0);
  return dateTime.toISOString();
}

function getDefaultStartHour(): string {
  const now = new Date();
  const roundedMinutes = now.getMinutes() === 0
    ? 0
    : now.getMinutes() <= 30
      ? 30
      : 0;
  const hour = now.getMinutes() > 30 ? now.getHours() + 1 : now.getHours();
  const safeHour = Math.min(hour, 22);
  return `${String(safeHour).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`;
}

function getDefaultEndHour(startHour: string): string {
  const [hours, minutes] = startHour.split(':').map(Number);
  const endHour = Math.min(hours + 3 + (minutes === 30 ? 1 : 0), 23);
  return `${String(endHour).padStart(2, '0')}:00`;
}

export default function SallesPage() {
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Étape du parcours : 'recherche' | 'salles_dispo' | 'reserver_salle'
  const [activeStep, setActiveStep] = useState<'recherche' | 'salles_dispo' | 'reserver_salle'>('recherche');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [roomFilters, setRoomFilters] = useState<RoomFilters>({
    types: [],
    capacity: 'all',
    accessible: false,
  });


  // Données du créneau choisi
  const [selectedStartDate, setSelectedStartDate] = useState<Date>(() => new Date());
  const [selectedEndDate, setSelectedEndDate] = useState<Date>(() => new Date());
  const [startHour, setStartHour] = useState<string>(() => getDefaultStartHour());
  const [endHour, setEndHour] = useState<string>(() => getDefaultEndHour(getDefaultStartHour()));
  const [attendees, setAttendees] = useState<number | ''>('');

  // Salle sélectionnée pour la réservation finale
  const [chosenRoom, setChosenRoom] = useState<PublicRoom | null>(null);
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([]);
  const [availableRoomIds, setAvailableRoomIds] = useState<Set<number> | null>(null);

  // Filtre de recherche par équipement / texte
  const [searchFilter, setSearchFilter] = useState('');

  // Vérification de permission dans le JWT
  const [moduleForbidden] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
    if (!token) return false;
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        return payload.moduleSalleActif === false;
      }
    } catch {
      return false;
    }
    return false;
  });

  // Chargement initial du catalogue
  useEffect(() => {
    let active = true;

    async function loadRooms() {
      try {
        setLoadingRooms(true);
        setError(null);
        const list = await getPublicRooms();
        if (active) {
          setRooms(list);
        }
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Impossible de charger le catalogue des salles municipales.',
          );
        }
      } finally {
        if (active) {
          setLoadingRooms(false);
        }
      }
    }

    loadRooms();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!chosenRoom) return;
    let active = true;

    const start = formatSlotDateTime(selectedStartDate, startHour);
    const end = formatSlotDateTime(selectedEndDate, endHour);

    getRoomAvailability(chosenRoom.id, start, end)
      .then((res) => {
        if (active) {
          setOccupiedSlots(res.occupiedSlots ?? []);
        }
      })
      .catch((err) => {
        console.warn('Impossible de charger les disponibilités :', err);
      });

    return () => {
      active = false;
    };
  }, [chosenRoom, endHour, selectedEndDate, selectedStartDate, startHour]);

  // Validation du créneau dans la popup (Image 1, Screen 2)
  const handleValidateSlot = (
    startDate: Date,
    endDate: Date,
    newStart: string,
    newEnd: string,
    newAttendees?: number | '',
  ) => {
    setSelectedStartDate(startDate);
    setSelectedEndDate(endDate);
    setStartHour(newStart);
    setEndHour(newEnd);
    if (newAttendees !== undefined) {
      setAttendees(newAttendees);
    }
    setActiveStep('salles_dispo');
  };

  const handleOpenSlotModal = () => {
    if (activeStep === 'recherche') {
      const defaultStartHour = getDefaultStartHour();
      setStartHour(defaultStartHour);
      setEndHour(getDefaultEndHour(defaultStartHour));
    }
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (activeStep !== 'salles_dispo') return;

    if (rooms.length === 0) {
      setAvailableRoomIds(new Set());
      setLoadingAvailability(false);
      return;
    }

    let active = true;
    const start = formatSlotDateTime(selectedStartDate, startHour);
    const end = formatSlotDateTime(selectedEndDate, endHour);

    setLoadingAvailability(true);
    setAvailabilityError(null);
    setAvailableRoomIds(null);

    Promise.all(
      rooms.map(async (room) => {
        const availability = await getRoomAvailability(room.id, start, end);
        return {
          roomId: room.id,
          isAvailable: availability.occupiedSlots.length === 0,
        };
      }),
    )
      .then((results) => {
        if (!active) return;
        setAvailableRoomIds(
          new Set(results.filter((result) => result.isAvailable).map((result) => result.roomId)),
        );
      })
      .catch((err: unknown) => {
        if (!active) return;
        setAvailableRoomIds(new Set());
        setAvailabilityError(
          err instanceof Error
            ? err.message
            : 'Impossible de vérifier la disponibilité des salles pour ce créneau.',
        );
      })
      .finally(() => {
        if (active) setLoadingAvailability(false);
      });

    return () => {
      active = false;
    };
  }, [activeStep, endHour, rooms, selectedEndDate, selectedStartDate, startHour]);

  // Sélection d'une salle depuis la liste des résultats (Image 1, Screen 3)
  const handleReserveRoom = async (room: PublicRoom) => {
    const start = formatSlotDateTime(selectedStartDate, startHour);
    const end = formatSlotDateTime(selectedEndDate, endHour);

    setLoadingAvailability(true);
    setAvailabilityError(null);
    try {
      const availability = await getRoomAvailability(room.id, start, end);
      if (availability.occupiedSlots.length > 0) {
        setAvailableRoomIds((current) => {
          if (!current) return current;
          const next = new Set(current);
          next.delete(room.id);
          return next;
        });
        setAvailabilityError(
          `La salle « ${room.nom} » vient d’être réservée sur le créneau sélectionné. Elle a été retirée des résultats.`,
        );
        return;
      }

      setOccupiedSlots([]);
      setChosenRoom(room);
      setActiveStep('reserver_salle');
    } catch (err: unknown) {
      setAvailabilityError(
        err instanceof Error
          ? err.message
          : 'Impossible de vérifier la disponibilité de cette salle.',
      );
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleReservationConflict = (room: PublicRoom) => {
    setAvailableRoomIds((current) => {
      if (!current) return current;
      const next = new Set(current);
      next.delete(room.id);
      return next;
    });
    setChosenRoom(null);
    setActiveStep('salles_dispo');
    setAvailabilityError(
      `La salle « ${room.nom} » vient d’être réservée sur le créneau sélectionné. Elle a été retirée des résultats.`,
    );
  };

  // Filtrage des salles
  const filteredRooms = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    return rooms.filter((r) => {
      if (!q) return true;
      const matchName = r.nom.toLowerCase().includes(q);
      const matchDesc = r.description?.toLowerCase().includes(q) ?? false;
      const matchAddr = r.adresse.toLowerCase().includes(q);
      const matchEq = r.equipementsInclus.some((eq) => eq.toLowerCase().includes(q));
      return matchName || matchDesc || matchAddr || matchEq;
    });
  }, [rooms, searchFilter]);

  const filteredRoomsWithFilters = useMemo(() => {
    return filteredRooms.filter((room) => {
      const matchesCapacity =
        attendees === '' || room.capaciteMax >= attendees;
      const matchesAvailability =
        availableRoomIds !== null && availableRoomIds.has(room.id);

      return matchesAvailability && matchesCapacity && matchesRoomFilters(room, roomFilters);
    });
  }, [attendees, availableRoomIds, filteredRooms, roomFilters]);

  const filterableRooms = useMemo(() => {
    return filteredRooms.filter((room) => {
      const matchesCapacity =
        attendees === '' || room.capaciteMax >= attendees;
      const matchesAvailability =
        availableRoomIds !== null && availableRoomIds.has(room.id);

      return matchesAvailability && matchesCapacity;
    });
  }, [attendees, availableRoomIds, filteredRooms]);

  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-328">
        {/* Alerte si module désactivé */}
        {moduleForbidden && (
          <aside
            role="alert"
            className="mb-8 rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-900 shadow-xs"
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl" aria-hidden="true">🔒</span>
              <div>
                <h2 className="text-base font-black">
                  Module « Salles » non activé pour votre association
                </h2>
                <p className="mt-1 text-sm text-amber-800">
                  L&apos;accès à la réservation des salles communales n&apos;est pas encore activé par les services municipaux pour votre compte. Veuillez contacter la mairie pour formuler une demande d&apos;habilitation.
                </p>
              </div>
            </div>
          </aside>
        )}

        {/* Erreur de chargement */}
        {error && (
          <div role="alert" className="mb-8 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* ========================================================
            ÉCRAN 1 : "Salle recherche" (Image 1, Screen 1)
           ======================================================== */}
        {activeStep === 'recherche' && (
          <div className="space-y-8 animate-in fade-in">
            {/* Titre & Sous-titre */}
            <header className="border-b border-line pb-6">
              <p className="text-label font-bold uppercase tracking-eyebrow text-primary">
                Demande de salle
              </p>
              <h1 className="mt-1 text-4xl font-black tracking-display text-ink sm:text-5xl">
                Demande de salle
              </h1>
              <p className="mt-2 text-sm text-muted">
                Sélectionnez un créneau pour réserver une salle adaptée à votre événement.
              </p>
            </header>

            {/* Barre de recherche du créneau */}
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  placeholder="Veuillez sélectionner un créneau pour commencer"
                  onClick={handleOpenSlotModal}
                  className="w-full cursor-pointer rounded-full border border-line bg-paper/60 px-6 py-4 pr-14 text-sm font-medium text-ink placeholder:text-muted/70 shadow-xs outline-none transition-all hover:border-primary focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleOpenSlotModal}
                  className="absolute inset-y-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink transition-colors hover:bg-primary-soft hover:text-primary cursor-pointer"
                  aria-label="Ouvrir le calendrier pour sélectionner un créneau"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              </div>

              {/* Ligne d'actions sous la barre */}
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                {/* <button
                  type="button"
                  onClick={handleOpenSlotModal}
                  className="flex items-center gap-2 text-muted hover:text-ink cursor-pointer transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  <span>Filtrer les salles</span>
                </button> */}

                <div className="flex items-center gap-1 text-muted">
                  <span className="p-1 rounded-sm bg-paper text-primary">⊞</span>
                  <span className="p-1 rounded-sm hover:bg-paper">☰</span>
                </div>
              </div>
            </div>

            {/* État vide initial */}
            <section
              aria-label="En attente de sélection"
              className="mt-16 flex flex-col items-center justify-center py-24 text-center"
            >
              <h2 className="text-xl font-black tracking-tight text-ink">
                Sélectionnez un créneau pour commencer
              </h2>
              <p className="mt-2 text-xs text-muted">
                Les salles disponibles apparaîtront ici.
              </p>
             
            </section>
          </div>
        )}

        {/* ========================================================
            ÉCRAN 2 : "Salle dispo" (Image 1, Screen 3)
           ======================================================== */}
        {activeStep === 'salles_dispo' && (
          <div className="space-y-8 animate-in fade-in">
            {/* En-tête avec bouton Retour & résumé du créneau centré */}
            <header className="relative border-b border-line pb-8">
              <button
                type="button"
                onClick={() => setActiveStep('recherche')}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted hover:text-ink cursor-pointer transition-colors"
              >
                ← RETOUR
              </button>

              <div className="mt-2 text-center">
                <p className="text-caption font-bold uppercase tracking-widest text-primary">
                  Créneau de {startHour} à {endHour}
                </p>
                <h1 className="mt-1 text-3xl font-black tracking-display text-ink sm:text-4xl">
                  {formatDateRange(selectedStartDate, selectedEndDate)}
                </h1>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="mt-2 text-caption font-bold uppercase tracking-wider text-muted underline hover:text-primary cursor-pointer transition-colors"
                >
                  Modifier le créneau
                </button>
              </div>
            </header>

            {/* Barre de recherche par équipement */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Rechercher par équipement..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full rounded-md border border-line bg-paper/50 px-4 py-2.5 text-xs text-ink placeholder:text-muted/70 outline-none focus:border-primary"
                />
              </div> */}
               <button
                  type="button"
                  onClick={() => setIsFilterOpen(true)}
                  className="flex items-center gap-2 text-muted hover:text-ink cursor-pointer transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  <span>Filtrer les salles</span>
                </button>


              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="font-bold text-ink">
                  {filteredRoomsWithFilters.length} Salle{filteredRoomsWithFilters.length > 1 ? 's' : ''} disponible{filteredRoomsWithFilters.length > 1 ? 's' : ''}
                </span>
                <span className="text-muted">
                  pour le créneau du {formatDateDisplay(selectedStartDate)}
                  {selectedStartDate.getTime() !== selectedEndDate.getTime() && (
                    <> au {formatDateDisplay(selectedEndDate)}</>
                  )}
                </span>
              </div>
            </div>

            {/* Grille des salles */}
            {availabilityError && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
                {availabilityError}
              </div>
            )}

            {loadingRooms || loadingAvailability ? (
              <div className="flex h-64 items-center justify-center text-muted">
                <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mr-3" />
                {loadingRooms ? 'Chargement des salles disponibles...' : 'Vérification des disponibilités...'}
              </div>
            ) : filteredRoomsWithFilters.length === 0 ? (
              <div className="rounded-xl border border-line bg-paper/40 p-12 text-center text-muted">
                Aucune salle ne correspond à vos critères de recherche.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRoomsWithFilters.map((room) => (
                  <RoomCatalogCard
                    key={room.id}
                    room={room}
                    isAvailable={true}
                    onReserve={handleReserveRoom}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            ÉCRAN 3 : "Réserver salle" (Image 2)
           ======================================================== */}
        {activeStep === 'reserver_salle' && chosenRoom && (
          <RoomBookingDetailView
            room={chosenRoom}
            selectedStartDate={selectedStartDate}
            selectedEndDate={selectedEndDate}
            startHour={startHour}
            endHour={endHour}
            initialAttendees={attendees}
            occupiedSlots={occupiedSlots}
            onBack={() => setActiveStep('salles_dispo')}
            onReservationConflict={() => handleReservationConflict(chosenRoom)}
            onReservationCreated={(slot) => setOccupiedSlots((prev) => [...prev, slot])}
          />
        )}

        {/* ========================================================
            POPUP : "Popup date salle" (Image 1, Screen 2)
           ======================================================== */}
        <RoomSlotModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialStartDate={selectedStartDate}
          initialEndDate={selectedEndDate}
          initialStartHour={startHour}
          initialEndHour={endHour}
          initialAttendees={attendees}
          onValidateSlot={handleValidateSlot}
        />
        <RoomFiltersAside
          isOpen={isFilterOpen}
          rooms={filterableRooms}
          filters={roomFilters}
          onApply={setRoomFilters}
          onClose={() => setIsFilterOpen(false)}
          onReset={() => setRoomFilters({ types: [], capacity: 'all', accessible: false })}
        />
      </div>
    </main>
  );
}
