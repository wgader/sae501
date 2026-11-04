'use client';

import { useMemo, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
  IconChevronLeft,
  IconChevronRight,
  IconDoubleChevronLeft,
  IconDoubleChevronRight,
} from '@/components/ui/icons';

export const roomCalendarVariants = cva('w-full');

export const monthNames = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];
const weekDaysShort = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const weekDaysLong = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export const isSameDay = (d1: Date, d2: Date) => {
  return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
};

const getRoomBg = (colorClass: string) => {
  const map: Record<string, string> = {
    'room-blue': 'bg-primary-soft',
    'room-green': 'bg-accent',
    'room-orange': 'bg-amber-200',
    'room-sage': 'bg-sage',
  };
  return map[colorClass] || 'bg-transparent';
};

export const getMockReservations = (date: Date, filter: string, rooms: Room[]) => {
  const seed = date.getDate() + date.getMonth();
  const numRes = seed % 4;

  let dayRooms = [];
  for (let i = 0; i < numRes; i++) {
    dayRooms.push(rooms[(seed + i) % rooms.length]);
  }

  if (filter !== 'Toutes les salles') {
    dayRooms = dayRooms.filter((r) => r.name === filter);
  }

  const uniqueRooms = [];
  const map = new Map();
  for (const item of dayRooms) {
    if (!map.has(item.name)) {
      map.set(item.name, true);
      uniqueRooms.push(item);
    }
  }

  return uniqueRooms;
};

export interface Room {
  name: string;
  capacity: string;
  color: string;
}

export interface RoomCalendarDataProps {
  rooms: Room[];
  selectedDate: Date | null;
}

export interface RoomCalendarProps
  extends VariantProps<typeof roomCalendarVariants> {
  onDateSelect: (date: Date) => void;
  onNextStep: () => void;
  className?: string;
}

export default function RoomCalendar({
  rooms,
  selectedDate,
  onDateSelect,
  onNextStep,
  className,
}: RoomCalendarDataProps & RoomCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [roomFilter, setRoomFilter] = useState('Toutes les salles');
  const [isDayMenuOpen, setIsDayMenuOpen] = useState(false);

  const displayDays = useMemo(() => {
    if (calendarView === 'day') {
      return [new Date(viewDate)];
    }

    if (calendarView === 'week') {
      const days = [];
      const current = new Date(viewDate);
      const day = current.getDay();
      const diff = current.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(current.setDate(diff));

      for (let i = 0; i < 7; i++) {
        const next = new Date(monday);
        next.setDate(monday.getDate() + i);
        days.push(next);
      }
      return days;
    }

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const padding = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days: (Date | null)[] = [];
    for (let i = 0; i < padding; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));

    return days;
  }, [viewDate, calendarView]);

  const handlePrev = () => {
    const newDate = new Date(viewDate);
    if (calendarView === 'month') newDate.setMonth(newDate.getMonth() - 1);
    if (calendarView === 'week') newDate.setDate(newDate.getDate() - 7);
    if (calendarView === 'day') newDate.setDate(newDate.getDate() - 1);
    setViewDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(viewDate);
    if (calendarView === 'month') newDate.setMonth(newDate.getMonth() + 1);
    if (calendarView === 'week') newDate.setDate(newDate.getDate() + 7);
    if (calendarView === 'day') newDate.setDate(newDate.getDate() + 1);
    setViewDate(newDate);
  };

  const handleYearChange = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(newDate.getFullYear() + offset);
    setViewDate(newDate);
  };

  const formatHeader = () => {
    if (calendarView === 'month' || calendarView === 'week') {
      return `${monthNames[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
    }
    return `${weekDaysLong[viewDate.getDay()]} ${viewDate.getDate()} ${monthNames[viewDate.getMonth()]}`;
  };

  const roomFilters = ['Toutes les salles', ...rooms.map((room) => room.name)];
  const visibleRooms = rooms.filter((room) => roomFilter === 'Toutes les salles' || room.name === roomFilter);
  const selectedDateFull = selectedDate
    ? `${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()].toLowerCase()} ${selectedDate.getFullYear()}`
    : '';

  return (
    <section className={cn('mt-8 mb-6', className)} aria-label="Calendrier de réservation des salles">
      <header className="mb-8 flex items-center justify-center gap-4 text-xl font-black uppercase tracking-widest text-ink sm:text-2xl">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => handleYearChange(-1)}
            className="p-1 text-muted transition-colors hover:text-ink cursor-pointer"
            aria-label="Année précédente"
          >
            <IconDoubleChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handlePrev}
            className="p-1 text-ink transition-opacity hover:opacity-70 cursor-pointer"
            aria-label="Mois précédent"
          >
            <IconChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <span className="min-w-60 text-center sm:min-w-75">{formatHeader()}</span>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleNext}
            className="p-1 text-ink transition-opacity hover:opacity-70 cursor-pointer"
            aria-label="Mois suivant"
          >
            <IconChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleYearChange(1)}
            className="p-1 text-muted transition-colors hover:text-ink cursor-pointer"
            aria-label="Année suivante"
          >
            <IconDoubleChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Filtres par salle en bureau */}
      <nav aria-label="Filtrer les salles" className="custom-scrollbar mb-6 hidden gap-3 overflow-x-auto pb-3 sm:flex">
        {roomFilters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => {
              setRoomFilter(filter);
              setIsDayMenuOpen(false);
            }}
            className={`shrink-0 rounded-xs border px-4 py-3 text-caption font-bold uppercase tracking-label transition-all cursor-pointer sm:text-meta ${
              roomFilter === filter
                ? 'border-primary bg-primary text-white shadow-xs'
                : 'border-line bg-white text-ink hover:border-primary hover:bg-primary-soft'
            }`}
          >
            {filter}
          </button>
        ))}
      </nav>

      {/* Sélecteur mobile */}
      <div className="relative mb-6 sm:hidden">
        <label htmlFor="room-filter-select" className="sr-only">
          Choisir une salle
        </label>
        <select
          id="room-filter-select"
          value={roomFilter}
          onChange={(e) => {
            setRoomFilter(e.target.value);
            setIsDayMenuOpen(false);
          }}
          className="w-full appearance-none rounded-xs border border-ink bg-white px-4 py-3 text-meta font-bold uppercase tracking-label text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        >
          {roomFilters.map((filter) => (
            <option key={filter} value={filter}>
              {filter}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-ink" aria-hidden="true">
          <IconChevronRight className="h-4 w-4 rotate-90" />
        </div>
      </div>

      {/* Onglets vues: Mois, Semaine, Jour */}
      <div className="mb-6 flex gap-6 border-b border-line sm:gap-8">
        <button
          type="button"
          className={`pb-3 text-sm transition-colors cursor-pointer ${
            calendarView === 'month'
              ? 'border-b-2 border-ink font-bold text-ink'
              : 'font-normal text-muted hover:text-ink'
          }`}
          onClick={() => setCalendarView('month')}
        >
          Par Mois
        </button>
        <button
          type="button"
          className={`pb-3 text-sm transition-colors cursor-pointer ${
            calendarView === 'week'
              ? 'border-b-2 border-ink font-bold text-ink'
              : 'font-normal text-muted hover:text-ink'
          }`}
          onClick={() => setCalendarView('week')}
        >
          Par Semaine
        </button>
        <button
          type="button"
          className={`pb-3 text-sm transition-colors cursor-pointer ${
            calendarView === 'day'
              ? 'border-b-2 border-ink font-bold text-ink'
              : 'font-normal text-muted hover:text-ink'
          }`}
          onClick={() => setCalendarView('day')}
        >
          Par Jour
        </button>
      </div>

      {/* Grille du calendrier */}
      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-xs">
        {calendarView !== 'day' && (
          <div className="hidden grid-cols-7 border-b border-line bg-paper sm:grid">
            {calendarView === 'month' &&
              weekDaysShort.map((day) => (
                <div
                  key={day}
                  className="border-r border-line py-2.5 text-center text-meta font-bold uppercase tracking-widest text-muted last:border-r-0"
                >
                  {day}
                </div>
              ))}
            {calendarView === 'week' &&
              displayDays.map(
                (d, i) =>
                  d && (
                    <div
                      key={i}
                      className="border-r border-line py-3 text-center last:border-r-0"
                    >
                      <span className="block text-caption font-bold uppercase tracking-widest text-muted">
                        {weekDaysShort[d.getDay()]}
                      </span>
                      <span className="mt-0.5 block text-lg font-black text-ink">{d.getDate()}</span>
                    </div>
                  ),
              )}
          </div>
        )}

        <div className={`grid ${calendarView === 'day' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-7'}`}>
          {displayDays.map((dateObj, index) => {
            if (!dateObj) {
              return (
                <div
                  key={index}
                  className="hidden border-r border-b border-line bg-paper/50 sm:block"
                />
              );
            }

            const isSelected = selectedDate && isSameDay(dateObj, selectedDate);
            const isToday = isSameDay(dateObj, today);
            const isPast = dateObj.getTime() < today.getTime();
            const dayReservations = getMockReservations(dateObj, roomFilter, rooms);

            return (
              <article
                key={index}
                onClick={() => {
                  if (isPast) return;
                  onDateSelect(dateObj);
                  setIsDayMenuOpen(true);
                }}
                className={`
                  group relative flex flex-col border-b border-line transition-colors sm:border-r
                  ${calendarView === 'week' ? 'min-h-40' : calendarView === 'month' ? 'min-h-28' : 'min-h-75'}
                  ${
                    isPast
                      ? 'cursor-not-allowed bg-paper opacity-60'
                      : isSelected
                        ? 'cursor-pointer bg-primary-soft ring-2 ring-inset ring-primary'
                        : 'cursor-pointer bg-white hover:bg-paper'
                  }
                `}
              >
                <header
                  className={`
                  flex items-center justify-between p-3 sm:p-2.5 
                  ${calendarView === 'day' ? 'border-b border-line bg-paper p-4' : ''}
                  ${calendarView === 'week' ? 'border-b border-line bg-paper sm:hidden' : ''}
                  ${calendarView === 'month' ? 'border-b border-line bg-paper sm:border-none sm:bg-transparent' : ''}
                `}
                >
                  <div className="flex items-center gap-3 sm:gap-0">
                    {calendarView !== 'day' && (
                      <span className="w-10 text-xs font-bold uppercase tracking-widest text-muted sm:hidden">
                        {weekDaysShort[dateObj.getDay()]}
                      </span>
                    )}

                    <div
                      className={`
                      flex items-center justify-center font-bold 
                      ${calendarView === 'day' ? 'text-xl' : 'h-7 w-7 rounded-full text-sm'}
                      ${isToday && !isSelected ? 'bg-ink text-white' : ''}
                      ${isSelected && calendarView !== 'day' ? 'bg-primary text-white' : 'text-ink'}
                    `}
                    >
                      {calendarView === 'day'
                        ? `${weekDaysLong[dateObj.getDay()]} ${dateObj.getDate()} ${monthNames[dateObj.getMonth()]}`
                        : dateObj.getDate()}
                    </div>
                  </div>

                  {calendarView === 'day' && (
                    <span className="rounded-control border border-line bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-muted">
                      {dayReservations.length} réservation(s)
                    </span>
                  )}
                </header>

                <div
                  className={`custom-scrollbar flex flex-1 flex-col gap-1.5 p-2 ${
                    calendarView !== 'day' ? 'overflow-y-auto' : 'gap-3 p-4'
                  }`}
                >
                  {dayReservations.length > 0 ? (
                    dayReservations.map((room, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 ${
                          calendarView === 'day'
                            ? 'rounded-control border border-line bg-white p-4 shadow-xs'
                            : ''
                        }`}
                      >
                        <span className={`h-2 w-2 shrink-0 rounded-full ${getRoomBg(room.color)}`} />
                        <span
                          className={`font-bold uppercase leading-tight text-ink ${
                            calendarView === 'day' ? 'text-sm' : 'truncate text-caption'
                          }`}
                        >
                          {calendarView === 'month' ? room.name.split(' ').slice(1).join(' ') : room.name}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div
                      className={`flex h-full items-center justify-center font-medium italic text-muted ${
                        calendarView === 'day' ? 'text-base' : 'text-caption'
                      }`}
                    >
                      Aucune réservation
                    </div>
                  )}
                </div>

                {!isPast && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-primary opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </article>
            );
          })}
        </div>
      </div>

      {/* Dialogue modal de sélection */}
      {isDayMenuOpen && selectedDate && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl duration-200 animate-in zoom-in-95">
            <header className="flex items-center justify-between bg-primary p-5 text-white">
              <div>
                <p className="mb-0.5 text-caption font-bold uppercase tracking-widest opacity-80">
                  Réservation pour le
                </p>
                <h3 className="text-xl font-black">{selectedDateFull}</h3>
              </div>
              <button
                className="rounded-full p-1.5 transition-colors hover:bg-white/20 cursor-pointer"
                type="button"
                onClick={() => setIsDayMenuOpen(false)}
                aria-label="Fermer"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div className="flex flex-col gap-4 p-6 text-center">
              {roomFilter === 'Toutes les salles' ? (
                <>
                  <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <strong className="text-xl font-black text-ink">{rooms.length} salles au catalogue</strong>
                  <p className="text-xs text-muted">Pour la journée complète.</p>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <strong className="text-xl font-black uppercase text-ink">
                    {visibleRooms[0]?.name ?? rooms[0].name}
                  </strong>
                  <p className="text-xs text-muted">
                    Voir la disponibilité de cette salle pour la journée.
                  </p>
                </>
              )}

              <button
                className="mt-2 w-full rounded-control bg-ink py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-primary cursor-pointer"
                type="button"
                onClick={() => {
                  setIsDayMenuOpen(false);
                  onNextStep();
                }}
              >
                Passer à la sélection
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDate && (
        <aside className="room-selection-line mt-6 flex justify-between border-l-4 border-primary bg-white p-4 text-sm text-muted shadow-xs">
          <span>Date choisie</span>
          <strong className="text-primary">{selectedDateFull}</strong>
        </aside>
      )}
    </section>
  );
}