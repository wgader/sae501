'use client';

type StatusFilter = 'ALL' | 'PENDING' | 'VALIDATED' | 'REFUSED';

interface EventFiltersProps {
  statusFilter: StatusFilter;
  dateFilter: string;
  onStatusChange: (value: StatusFilter) => void;
  onDateChange: (value: string) => void;
}

const statuses: Array<[StatusFilter, string]> = [
  ['ALL', 'Tous'],
  ['PENDING', 'En attente'],
  ['VALIDATED', 'Validés'],
  ['REFUSED', 'Refusés'],
];

export default function EventFilters({
  statusFilter,
  dateFilter,
  onStatusChange,
  onDateChange,
}: EventFiltersProps) {
  return (
    <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <nav aria-label="Filtrer par statut" className="flex flex-wrap gap-2">
        {statuses.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onStatusChange(value)}
            aria-pressed={statusFilter === value}
            className={`min-h-10 min-w-0 rounded-control border px-4 py-2 text-[0.7rem] font-bold uppercase tracking-label ${
              statusFilter === value
                ? 'border-primary bg-primary text-white'
                : 'border-line bg-paper text-ink hover:border-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
        Date de début
        <input
          type="date"
          value={dateFilter}
          onChange={(event) => onDateChange(event.target.value)}
          className="rounded-lg border border-[var(--line)] bg-[var(--White)] px-3 py-2 text-sm font-normal normal-case tracking-normal text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--Mosaic-Tile)]/30"
        />
      </label>
    </div>
  );
}

export type { StatusFilter };
