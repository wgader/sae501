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
    'room-blue': 'bg-[var(--Mint-Cream)]',
    'room-green': 'bg-[var(--Lime-Cream)]',
    'room-orange': 'bg-amber-200',
    'room-sage': 'bg-[var(--Pale-Sage)]',
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
  const [viewDate, setViewDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [isDayMenuOpen, setIsDayMenuOpen] = useState(false);
  const [roomFilter, setRoomFilter] = useState('Toutes les salles');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const displayDays = useMemo(() => {
    const baseDate = new Date(viewDate);
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();

    if (calendarView === 'month') {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay();
      const offset = firstDay === 0 ? 6 : firstDay - 1;

      const days = [];
      for (let i = 0; i < offset; i++) days.push(null);
      for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
      return days;
    }

    if (calendarView === 'week') {
      const day = baseDate.getDay();
      const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(year, month, diff);

      const days = [];
      for (let i = 0; i < 7; i++) {
        days.push(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
      }
      return days;
    }

    return [baseDate];
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
      <header className="mb-8 flex items-center justify-center gap-4 text-xl font-black uppercase tracking-widest text-[var(--ink)] sm:text-2xl">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => handleYearChange(-1)}
            className="p-1 text-[var(--muted)] transition-colors hover:text-[var(--ink)] cursor-pointer"
            aria-label="Année précédente"
          >
            <IconDoubleChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handlePrev}
            className="p-1 text-[var(--ink)] transition-opacity hover:opacity-70 cursor-pointer"
            aria-label="Mois précédent"
          >
            <IconChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <span className="min-w-[15rem] text-center sm:min-w-[18.75rem]">{formatHeader()}</span>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleNext}
            className="p-1 text-[var(--ink)] transition-opacity hover:opacity-70 cursor-pointer"
            aria-label="Mois suivant"
          >
            <IconChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleYearChange(1)}
            className="p-1 text-[var(--muted)] transition-colors hover:text-[var(--ink)] cursor-pointer"
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
            className={`shrink-0 rounded-[4px] border px-4 py-3 text-[0.63rem] font-bold uppercase tracking-[0.15em] transition-all cursor-pointer sm:text-[0.69rem] ${
              roomFilter === filter
                ? 'border-[var(--Mosaic-Tile)] bg-[var(--Mosaic-Tile)] text-[var(--White)] shadow-xs'
                : 'border-[var(--line)] bg-[var(--White)] text-[var(--ink)] hover:border-[var(--Mosaic-Tile)] hover:bg-[var(--Pale-Sage)]/40'
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
          className="w-full appearance-none rounded-[4px] border border-[var(--ink)] bg-[var(--White)] px-4 py-3 text-[0.69rem] font-bold uppercase tracking-[0.15em] text-[var(--ink)] outline-none focus:border-[var(--Mosaic-Tile)] focus:ring-1 focus:ring-[var(--Mosaic-Tile)]"
        >
          {roomFilters.map((filter) => (
            <option key={filter} value={filter}>
              {filter}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--ink)]" aria-hidden="true">
          <IconChevronRight className="h-4 w-4 rotate-90" />
        </div>
      </div>

      {/* Onglets vues: Mois, Semaine, Jour */}
      <div className="mb-6 flex gap-6 border-b border-[var(--line)] sm:gap-8">
        <button
          type="button"
          className={`pb-3 text-sm transition-colors cursor-pointer ${
            calendarView === 'month'
              ? 'border-b-2 border-[var(--ink)] font-bold text-[var(--ink)]'
              : 'font-normal text-[var(--muted)] hover:text-[var(--ink)]'
          }`}
          onClick={() => setCalendarView('month')}
        >
          Par Mois
        </button>
        <button
          type="button"
          className={`pb-3 text-sm transition-colors cursor-pointer ${
            calendarView === 'week'
              ? 'border-b-2 border-[var(--ink)] font-bold text-[var(--ink)]'
              : 'font-normal text-[var(--muted)] hover:text-[var(--ink)]'
          }`}
          onClick={() => setCalendarView('week')}
        >
          Par Semaine
        </button>
        <button
          type="button"
          className={`pb-3 text-sm transition-colors cursor-pointer ${
            calendarView === 'day'
              ? 'border-b-2 border-[var(--ink)] font-bold text-[var(--ink)]'
              : 'font-normal text-[var(--muted)] hover:text-[var(--ink)]'
          }`}
          onClick={() => setCalendarView('day')}
        >
          Par Jour
        </button>
      </div>

      {/* Grille du calendrier */}
      <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--White)] shadow-xs">
        {calendarView !== 'day' && (
          <header className="grid grid-cols-1 border-b border-[var(--line)] bg-[var(--paper)] sm:grid-cols-7">
            {calendarView === 'month' &&
              weekDaysShort.map((day) => (
                <div
                  key={day}
                  className="hidden border-r border-[var(--line)] py-2.5 text-center text-[0.69rem] font-bold uppercase tracking-widest text-[var(--muted)] last:border-r-0 sm:block"
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
                      className="hidden border-r border-[var(--line)] py-3 text-center last:border-r-0 sm:block"
                    >
                      <span className="block text-[0.63rem] font-bold uppercase tracking-widest text-[var(--muted)]">
                        {weekDaysShort[d.getDay()]}
                      </span>
                      <span className="mt-0.5 block text-lg font-black text-[var(--ink)]">{d.getDate()}</span>
                    </div>
                  ),
              )}
          </header>
        )}

        <div className={`grid ${calendarView === 'day' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-7'}`}>
          {displayDays.map((dateObj, index) => {
            if (!dateObj) {
              return (
                <div
                  key={index}
                  className="hidden border-r border-b border-[var(--line)] bg-[var(--paper)]/50 sm:block"
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
                  group relative flex flex-col border-b border-[var(--line)] transition-colors sm:border-r
                  ${calendarView === 'week' ? 'min-h-[10rem]' : calendarView === 'month' ? 'min-h-[6.88rem]' : 'min-h-[18.75rem]'}
                  ${
                    isPast
                      ? 'cursor-not-allowed bg-[var(--paper)] opacity-60'
                      : isSelected
                        ? 'cursor-pointer bg-[var(--Pale-Sage)]/40 ring-2 ring-inset ring-[var(--Mosaic-Tile)]'
                        : 'cursor-pointer bg-[var(--White)] hover:bg-[var(--paper)]'
                  }
                `}
              >
                <header
                  className={`
                  flex items-center justify-between p-3 sm:p-2.5 
                  ${calendarView === 'day' ? 'border-b border-[var(--line)] bg-[var(--paper)] p-4' : ''}
                  ${calendarView === 'week' ? 'border-b border-[var(--line)] bg-[var(--paper)] sm:hidden' : ''}
                  ${calendarView === 'month' ? 'border-b border-[var(--line)] bg-[var(--paper)] sm:border-none sm:bg-transparent' : ''}
                `}
                >
                  <div className="flex items-center gap-3 sm:gap-0">
                    {calendarView !== 'day' && (
                      <span className="w-10 text-xs font-bold uppercase tracking-widest text-[var(--muted)] sm:hidden">
                        {weekDaysShort[dateObj.getDay()]}
                      </span>
                    )}

                    <div
                      className={`
                      flex items-center justify-center font-bold 
                      ${calendarView === 'day' ? 'text-xl' : 'h-7 w-7 rounded-full text-sm'}
                      ${isToday && !isSelected ? 'bg-[var(--ink)] text-[var(--White)]' : ''}
                      ${isSelected && calendarView !== 'day' ? 'bg-[var(--Mosaic-Tile)] text-[var(--White)]' : 'text-[var(--ink)]'}
                    `}
                    >
                      {calendarView === 'day'
                        ? `${weekDaysLong[dateObj.getDay()]} ${dateObj.getDate()} ${monthNames[dateObj.getMonth()]}`
                        : dateObj.getDate()}
                    </div>
                  </div>

                  {calendarView === 'day' && (
                    <span className="rounded-md border border-[var(--line)] bg-[var(--White)] px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
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
                            ? 'rounded-md border border-[var(--line)] bg-[var(--White)] p-4 shadow-xs'
                            : ''
                        }`}
                      >
                        <span className={`h-2 w-2 shrink-0 rounded-full ${getRoomBg(room.color)}`} />
                        <span
                          className={`font-bold uppercase leading-tight text-[var(--ink)] ${
                            calendarView === 'day' ? 'text-sm' : 'truncate text-[0.56rem] sm:text-[0.63rem]'
                          }`}
                        >
                          {calendarView === 'month' ? room.name.split(' ').slice(1).join(' ') : room.name}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div
                      className={`flex h-full items-center justify-center font-medium italic text-[var(--muted)] ${
                        calendarView === 'day' ? 'text-base' : 'text-[0.63rem]'
                      }`}
                    >
                      Aucune réservation
                    </div>
                  )}
                </div>

                {!isPast && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-[var(--Mosaic-Tile)] opacity-0 transition-opacity group-hover:opacity-100" />
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/40 p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-sm overflow-hidden rounded-xl bg-[var(--White)] shadow-2xl duration-200 animate-in zoom-in-95">
            <header className="flex items-center justify-between bg-[var(--Mosaic-Tile)] p-5 text-[var(--White)]">
              <div>
                <p className="mb-0.5 text-[0.63rem] font-bold uppercase tracking-widest opacity-80">
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
                  <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--Pale-Sage)] text-[var(--Mosaic-Tile)]">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <strong className="text-xl font-black text-[var(--ink)]">{rooms.length} salles au catalogue</strong>
                  <p className="text-xs text-[var(--muted)]">Pour la journée complète.</p>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--Pale-Sage)] text-[var(--Mosaic-Tile)]">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <strong className="text-xl font-black uppercase text-[var(--ink)]">
                    {visibleRooms[0]?.name ?? rooms[0].name}
                  </strong>
                  <p className="text-xs text-[var(--muted)]">
                    Voir la disponibilité de cette salle pour la journée.
                  </p>
                </>
              )}

              <button
                className="mt-2 w-full rounded-md bg-[var(--ink)] py-3.5 text-xs font-bold uppercase tracking-widest text-[var(--White)] transition-colors hover:bg-[var(--Mosaic-Tile)] cursor-pointer"
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
        <aside className="room-selection-line mt-6 flex justify-between border-l-4 border-[var(--Mosaic-Tile)] bg-[var(--White)] p-4 text-sm text-[var(--muted)] shadow-xs">
          <span>Date choisie</span>
          <strong className="text-[var(--Mosaic-Tile)]">{selectedDateFull}</strong>
        </aside>
      )}
    </section>
  );
}