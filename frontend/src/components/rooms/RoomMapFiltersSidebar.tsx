'use client';

import { useState } from 'react';
import type { RoomTypologie } from '@/lib/api/types';
import {
  DEFAULT_ROOM_FILTERS,
  ROOM_EQUIPEMENT_OPTIONS,
  ROOM_TYPOLOGIE_OPTIONS,
  countActiveRoomFilters,
  type RoomFilters,
} from '@/lib/roomFilters';

interface RoomMapFiltersSidebarProps {
  filters: RoomFilters;
  onChange: (next: RoomFilters) => void;
  totalCount: number;
}

interface FilterAccordionSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const CAPACITY_PRESETS: ReadonlyArray<{ value: number | ''; label: string }> = [
  { value: '', label: 'Toutes les capacités' },
  { value: 20, label: '20 personnes et +' },
  { value: 50, label: '50 personnes et +' },
  { value: 100, label: '100 personnes et +' },
];

const TYPOLOGIE_CHOICES = ROOM_TYPOLOGIE_OPTIONS.filter(
  (opt): opt is { value: RoomTypologie; label: string } => opt.value !== 'all',
);

function FilterAccordionSection({
  title,
  defaultOpen = true,
  children,
}: FilterAccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-line py-4 last:border-b-0">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center justify-between text-left"
      >
        <span className="text-label font-black uppercase tracking-label text-ink">
          {title}
        </span>
        <span className="text-body font-bold text-muted" aria-hidden="true">
          {isOpen ? '−' : '+'}
        </span>
      </button>
      {isOpen && <div className="mt-3 space-y-2.5">{children}</div>}
    </div>
  );
}

export default function RoomMapFiltersSidebar({
  filters,
  onChange,
  totalCount,
}: RoomMapFiltersSidebarProps) {
  const activeCount = countActiveRoomFilters(filters);

  const toggleTypologie = (value: RoomTypologie) => {
    const current =
      filters.typologies.length > 0
        ? filters.typologies
        : filters.typologie !== 'all'
          ? [filters.typologie]
          : [];
    const exists = current.includes(value);
    const nextTypologies = exists ? current.filter((item) => item !== value) : [...current, value];
    onChange({ ...filters, typologie: 'all', typologies: nextTypologies });
  };

  const toggleEquipement = (value: string) => {
    const exists = filters.equipements.includes(value);
    const nextEquipements = exists
      ? filters.equipements.filter((item) => item !== value)
      : [...filters.equipements, value];
    onChange({ ...filters, equipements: nextEquipements });
  };

  const countLabel = `Voir ${totalCount} espace${totalCount > 1 ? 's' : ''}`;

  return (
    <aside
      aria-label="Filtres de la carte des salles"
      className="flex h-full flex-col justify-between bg-white"
    >
      {/* En-tête */}
      <div className="px-2 pt-2 pb-4 lg:pr-6">
        <p className="text-caption font-bold uppercase tracking-eyebrow text-primary">
          Affiner les résultats
        </p>
        <h2 className="mt-1 text-xl font-black tracking-tight text-ink">
          Filtrer les salles
        </h2>
      </div>

      {/* Sections de filtres dépliables */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 lg:pr-6">
        <FilterAccordionSection title="Types de salles">
          {TYPOLOGIE_CHOICES.map((opt) => {
            const checked =
              filters.typologies.includes(opt.value) ||
              (filters.typologies.length === 0 && filters.typologie === opt.value);
            return (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-3 py-0.5 text-body-sm font-semibold text-ink"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleTypologie(opt.value)}
                  className="h-4 w-4 rounded border-line accent-primary"
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </FilterAccordionSection>

        <FilterAccordionSection title="Capacité">
          {CAPACITY_PRESETS.map((preset) => {
            const checked = filters.capacityMin === preset.value;
            return (
              <label
                key={String(preset.value)}
                className="flex cursor-pointer items-center gap-3 py-0.5 text-body-sm font-semibold text-ink"
              >
                <input
                  type="radio"
                  name="map-filter-capacity"
                  checked={checked}
                  onChange={() => onChange({ ...filters, capacityMin: preset.value })}
                  className="h-4 w-4 accent-ink"
                />
                <span>{preset.label}</span>
              </label>
            );
          })}
        </FilterAccordionSection>

        <FilterAccordionSection title="Accessibilité">
          <label className="flex cursor-pointer items-center gap-3 py-0.5 text-body-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={filters.accessible}
              onChange={(e) => onChange({ ...filters, accessible: e.target.checked })}
              className="h-4 w-4 rounded border-line accent-primary"
            />
            <span>Accessible aux personnes handicapées</span>
          </label>
        </FilterAccordionSection>

        <FilterAccordionSection title="Équipements" defaultOpen={false}>
          {ROOM_EQUIPEMENT_OPTIONS.map((eq) => {
            const checked = filters.equipements.includes(eq.value);
            return (
              <label
                key={eq.value}
                className="flex cursor-pointer items-center gap-3 py-0.5 text-body-sm font-semibold text-ink"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleEquipement(eq.value)}
                  className="h-4 w-4 rounded border-line accent-primary"
                />
                <span>{eq.label}</span>
              </label>
            );
          })}
        </FilterAccordionSection>
      </div>

      {/* Pied de panneau avec actions */}
      <div className="flex items-center gap-3 bg-white px-2 pt-4 pb-2 lg:pr-6">
        <button
          type="button"
          disabled={activeCount === 0}
          onClick={() => onChange(DEFAULT_ROOM_FILTERS)}
          className="flex-1 cursor-pointer rounded-control border border-line bg-white px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
        >
          Réinitialiser
        </button>
        <div className="flex-1 rounded-control bg-primary px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white">
          {countLabel}
        </div>
      </div>
    </aside>
  );
}
