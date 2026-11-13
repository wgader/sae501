'use client';

import { useEffect, useState } from 'react';
import type { PublicRoom } from '@/lib/api';
import Button from '@/components/ui/Button';

export type RoomCapacityFilter = 'all' | 'under20' | 'under50';

export interface RoomFilters {
  types: string[];
  capacity: RoomCapacityFilter;
  accessible: boolean;
}

interface RoomFiltersAsideProps {
  isOpen: boolean;
  rooms: PublicRoom[];
  filters: RoomFilters;
  onApply: (filters: RoomFilters) => void;
  onClose: () => void;
  onReset: () => void;
}

const roomTypes = ['Plein Air', 'Spectacle', 'Réunion'];

function roomMatchesType(room: PublicRoom, type: string): boolean {
  const searchText = `${room.nom} ${room.description ?? ''}`.toLocaleLowerCase('fr-FR');
  return searchText.includes(type.toLocaleLowerCase('fr-FR'));
}

export function matchesRoomFilters(room: PublicRoom, filters: RoomFilters): boolean {
  const matchesType =
    filters.types.length === 0 || filters.types.some((type) => roomMatchesType(room, type));
  const matchesCapacity =
    filters.capacity === 'all' ||
    (filters.capacity === 'under20' && room.capaciteMax < 20) ||
    (filters.capacity === 'under50' && room.capaciteMax < 50);
  const matchesAccessibility = !filters.accessible || room.accesPmr;

  return matchesType && matchesCapacity && matchesAccessibility;
}

function countMatchingRooms(rooms: PublicRoom[], filters: RoomFilters): number {
  return rooms.filter((room) => matchesRoomFilters(room, filters)).length;
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line pt-6 pb-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-section text-ink">{title}</h2>
        <span className="text-lg leading-none text-muted" aria-hidden="true">−</span>
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export default function RoomFiltersAside({
  isOpen,
  rooms,
  filters,
  onApply,
  onClose,
  onReset,
}: RoomFiltersAsideProps) {
  const [draftFilters, setDraftFilters] = useState(filters);

  useEffect(() => {
    if (isOpen) setDraftFilters(filters);
  }, [filters, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resultCount = countMatchingRooms(rooms, draftFilters);

  const toggleType = (type: string) => {
    setDraftFilters((current) => ({
      ...current,
      types: current.types.includes(type)
        ? current.types.filter((selectedType) => selectedType !== type)
        : [...current.types, type],
    }));
  };

  const resetFilters = () => {
    const reset: RoomFilters = { types: [], capacity: 'all', accessible: false };
    setDraftFilters(reset);
    onReset();
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="room-filters-title">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-ink/35 backdrop-blur-xs"
        aria-label="Fermer les filtres"
        onClick={onClose}
      />

      <aside className="relative ml-auto flex h-full w-full max-w-[25.5rem] flex-col bg-white px-[1.875rem] pb-6 pt-8 shadow-[-1.125rem_0_3.125rem_rgba(0,0,0,0.18)]">
        <header className="flex items-start justify-between border-b border-line pb-7">
          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-eyebrow text-primary">
              Affiner les résultats
            </p>
            <h1 id="room-filters-title" className="mt-1 text-[1.75rem] font-black leading-tight tracking-display text-black">
              Filtrer les salles
            </h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-[2.625rem] w-[2.625rem] place-items-center rounded-full bg-paper text-3xl font-light leading-none text-black transition-colors hover:bg-line"
            aria-label="Fermer les filtres"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="custom-scrollbar flex-1 overflow-y-auto">
          <FilterSection title="Types de salles">
            {roomTypes.map((type, index) => (
              <label
                key={type}
                className={`flex min-h-12 cursor-pointer items-center gap-3 text-[0.8125rem] font-bold tracking-[0.03em] text-black ${
                  index > 0 ? 'border-t border-[#eff1f4]' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={draftFilters.types.includes(type)}
                  onChange={() => toggleType(type)}
                  className="h-[1.625rem] w-[1.625rem] cursor-pointer appearance-none rounded-md border border-line bg-paper checked:border-primary checked:bg-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <span>{type}</span>
              </label>
            ))}
          </FilterSection>

          <FilterSection title="Capacité">
            {[
              ['all', 'Toutes les capacités'],
              ['under20', 'Moins de 20'],
              ['under50', 'Moins de 50'],
            ].map(([value, label], index) => (
              <label
                key={value}
                className={`flex min-h-12 cursor-pointer items-center gap-3 text-[0.8125rem] font-bold tracking-[0.03em] text-black ${
                  index > 0 ? 'border-t border-[#eff1f4]' : ''
                }`}
              >
                <input
                  type="radio"
                  name="room-capacity"
                  value={value}
                  checked={draftFilters.capacity === value}
                  onChange={() => setDraftFilters((current) => ({ ...current, capacity: value as RoomCapacityFilter }))}
                  className="h-5 w-5 cursor-pointer accent-primary"
                />
                <span>{label}</span>
              </label>
            ))}
          </FilterSection>

          <FilterSection title="Accessibilité">
            <label className="flex min-h-12 cursor-pointer items-center gap-3 text-[0.8125rem] font-bold tracking-[0.03em] text-black">
              <input
                type="checkbox"
                checked={draftFilters.accessible}
                onChange={(event) => setDraftFilters((current) => ({ ...current, accessible: event.target.checked }))}
                className="h-[1.625rem] w-[1.625rem] cursor-pointer appearance-none rounded-md border border-line bg-paper checked:border-primary checked:bg-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span>Accessible aux personnes handicapées</span>
            </label>
          </FilterSection>
        </div>

        <footer className="grid grid-cols-[128px_1fr] gap-2.5 border-t border-transparent pt-6">
          <Button
            variant="secondary"
            size="lg"
            onClick={resetFilters}
            className="min-h-[3.125rem] px-2 text-[0.625rem] tracking-[0.11em] text-primary"
          >
            Réinitialiser
          </Button>
          <Button
            size="lg"
            onClick={() => {
              onApply(draftFilters);
              onClose();
            }}
            className="min-h-[3.125rem] px-2 text-[0.625rem] tracking-[0.11em]"
          >
            Voir {resultCount} espace{resultCount > 1 ? 's' : ''}
          </Button>
        </footer>
      </aside>
    </div>
  );
}
