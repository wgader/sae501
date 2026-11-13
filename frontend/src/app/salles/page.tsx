'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import RoomBookingDetailView from '@/components/rooms/RoomBookingDetailView';
import RoomCatalogCard from '@/components/rooms/RoomCatalogCard';
import RoomSlotModal from '@/components/rooms/RoomSlotModal';
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

export default function SallesPage() {
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Étape du parcours : 'recherche' | 'salles_dispo' | 'reserver_salle'
  const [activeStep, setActiveStep] = useState<'recherche' | 'salles_dispo' | 'reserver_salle'>('recherche');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Données du créneau choisi
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [startHour, setStartHour] = useState<string>('09:00');
  const [endHour, setEndHour] = useState<string>('12:00');
  const [attendees, setAttendees] = useState<number | ''>('');

  // Salle sélectionnée pour la réservation finale
  const [chosenRoom, setChosenRoom] = useState<PublicRoom | null>(null);
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([]);

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

  // Chargement des disponibilités pour la salle choisie
  const fetchAvailability = useCallback(async (room: PublicRoom) => {
    try {
      const res = await getRoomAvailability(room.id);
      setOccupiedSlots(res.occupiedSlots ?? []);
    } catch (err: unknown) {
      console.warn('Impossible de charger les disponibilités :', err);
    }
  }, []);

  useEffect(() => {
    if (!chosenRoom) return;
    let active = true;

    getRoomAvailability(chosenRoom.id)
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
  }, [chosenRoom]);

  // Validation du créneau dans la popup (Image 1, Screen 2)
  const handleValidateSlot = (
    date: Date,
    newStart: string,
    newEnd: string,
    newAttendees?: number | '',
  ) => {
    setSelectedDate(date);
    setStartHour(newStart);
    setEndHour(newEnd);
    if (newAttendees !== undefined) {
      setAttendees(newAttendees);
    }
    setActiveStep('salles_dispo');
  };

  // Sélection d'une salle depuis la liste des résultats (Image 1, Screen 3)
  const handleReserveRoom = (room: PublicRoom) => {
    setChosenRoom(room);
    setActiveStep('reserver_salle');
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
              <h1 className="mt-1 text-4xl font-black tracking-display text-ink">
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
                  onClick={() => setIsModalOpen(true)}
                  className="w-full cursor-pointer rounded-full border border-line bg-paper/60 px-6 py-4 pr-14 text-sm font-medium text-ink placeholder:text-muted/70 shadow-xs outline-none transition-all hover:border-primary focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
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
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 text-muted hover:text-ink cursor-pointer transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  <span>Filtrer les salles</span>
                </button>

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
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-6 rounded-lg bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-primary-hover cursor-pointer"
              >
                Choisir un créneau →
              </button>
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
                  {formatDateTitle(selectedDate)}
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
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Rechercher par équipement..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full rounded-md border border-line bg-paper/50 px-4 py-2.5 text-xs text-ink placeholder:text-muted/70 outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="font-bold text-ink">
                  {filteredRooms.length} Salle{filteredRooms.length > 1 ? 's' : ''} disponible{filteredRooms.length > 1 ? 's' : ''}
                </span>
                <span className="text-muted">
                  pour le créneau du {formatDateDisplay(selectedDate)}
                </span>
              </div>
            </div>

            {/* Grille des salles */}
            {loadingRooms ? (
              <div className="flex h-64 items-center justify-center text-muted">
                <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mr-3" />
                Chargement des salles disponibles...
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="rounded-xl border border-line bg-paper/40 p-12 text-center text-muted">
                Aucune salle ne correspond à vos critères de recherche.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRooms.map((room) => (
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
            selectedDate={selectedDate}
            startHour={startHour}
            endHour={endHour}
            initialAttendees={attendees}
            occupiedSlots={occupiedSlots}
            onBack={() => setActiveStep('salles_dispo')}
            onRefreshCalendar={() => fetchAvailability(chosenRoom)}
            onReservationCreated={(slot) => setOccupiedSlots((prev) => [...prev, slot])}
          />
        )}

        {/* ========================================================
            POPUP : "Popup date salle" (Image 1, Screen 2)
           ======================================================== */}
        <RoomSlotModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialDate={selectedDate}
          initialStartHour={startHour}
          initialEndHour={endHour}
          initialAttendees={attendees}
          onValidateSlot={handleValidateSlot}
        />
      </div>
    </main>
  );
}
