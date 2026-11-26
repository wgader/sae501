'use client';

import {
  DEFAULT_ROOM_FILTERS,
  ROOM_EQUIPEMENT_OPTIONS,
  ROOM_TYPOLOGIE_OPTIONS,
  countActiveRoomFilters,
  type RoomFilters,
} from '@/lib/roomFilters';

interface RoomFiltersSidebarProps {
  filters: RoomFilters;
  onChange: (next: RoomFilters) => void;
  totalCount: number;
}

export default function RoomFiltersSidebar({
  filters,
  onChange,
  totalCount,
}: RoomFiltersSidebarProps) {
  const activeCount = countActiveRoomFilters(filters);

  const toggleEquipement = (value: string) => {
    const exists = filters.equipements.includes(value);
    const nextEquipements = exists
      ? filters.equipements.filter((item) => item !== value)
      : [...filters.equipements, value];
    onChange({ ...filters, equipements: nextEquipements });
  };

  return (
    <aside
      aria-label="Filtres du catalogue des salles"
      className="flex flex-col gap-5 rounded-card border border-line bg-white p-5 shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-tight text-ink">
            Filtres {activeCount > 0 && `(${activeCount})`}
          </h3>
          <p className="text-xs text-muted">
            {totalCount} salle{totalCount > 1 ? 's' : ''} affichée{totalCount > 1 ? 's' : ''}
          </p>
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_ROOM_FILTERS)}
            className="cursor-pointer text-xs font-bold text-primary underline underline-offset-2 hover:text-primary-hover"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Capacité minimale */}
      <div className="space-y-2">
        <label htmlFor="filter-capacity-min" className="block text-label font-bold uppercase tracking-label text-muted">
          Capacité minimale
        </label>
        <div className="relative">
          <input
            id="filter-capacity-min"
            type="number"
            min={1}
            step={5}
            placeholder="Ex. 50 personnes"
            value={filters.capacityMin}
            onChange={(e) => {
              const raw = e.target.value;
              onChange({
                ...filters,
                capacityMin: raw === '' ? '' : Math.max(1, Number.parseInt(raw, 10) || 1),
              });
            }}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-body-sm font-semibold text-ink placeholder:text-muted/60 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Accessibilité PMR */}
      <div className="space-y-2">
        <span className="block text-label font-bold uppercase tracking-label text-muted">
          Accessibilité
        </span>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line/70 bg-paper/50 px-3 py-2.5 text-body-sm font-bold text-ink transition-colors hover:border-primary/40">
          <input
            type="checkbox"
            checked={filters.accessible}
            onChange={(e) => onChange({ ...filters, accessible: e.target.checked })}
            className="h-4 w-4 accent-primary"
          />
          <span>Accès PMR uniquement</span>
        </label>
      </div>

      {/* Typologie de salle */}
      <div className="space-y-2">
        <label htmlFor="filter-typologie" className="block text-label font-bold uppercase tracking-label text-muted">
          Typologie de salle
        </label>
        <select
          id="filter-typologie"
          value={filters.typologie}
          onChange={(e) =>
            onChange({
              ...filters,
              typologie: e.target.value as RoomFilters['typologie'],
            })
          }
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-body-sm font-bold text-ink focus:border-primary focus:outline-none"
        >
          {ROOM_TYPOLOGIE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Équipements spécifiques */}
      <fieldset className="space-y-2">
        <legend className="text-label font-bold uppercase tracking-label text-muted">
          Équipements
        </legend>
        <div className="space-y-2 pt-1">
          {ROOM_EQUIPEMENT_OPTIONS.map((eq) => {
            const checked = filters.equipements.includes(eq.value);
            return (
              <label
                key={eq.value}
                className="flex cursor-pointer items-center gap-2.5 text-body-sm font-semibold text-ink"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleEquipement(eq.value)}
                  className="h-4 w-4 accent-primary"
                />
                <span>{eq.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </aside>
  );
}