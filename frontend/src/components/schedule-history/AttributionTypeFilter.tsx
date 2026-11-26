import { cva } from 'class-variance-authority';

export type AttributionFilter = 'all' | 'salle' | 'materiel';

const chipVariants = cva('cursor-pointer rounded-pill px-3 py-1.5 text-xs font-bold transition-colors', {
  variants: {
    selected: {
      true: 'bg-ink text-white',
      false: 'text-muted hover:text-ink',
    },
  },
});

interface AttributionTypeFilterProps {
  value: AttributionFilter;
  counts: Record<AttributionFilter, number>;
  onChange: (value: AttributionFilter) => void;
}

const OPTIONS: { value: AttributionFilter; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'salle', label: 'Salles' },
  { value: 'materiel', label: 'Matériel' },
];

/** Restreint la liste aux salles ou au matériel. */
export default function AttributionTypeFilter({ value, counts, onChange }: AttributionTypeFilterProps) {
  return (
    <div role="group" aria-label="Type d’attribution" className="inline-flex rounded-pill border border-line bg-white p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={chipVariants({ selected: value === option.value })}
        >
          {option.label} <span className="font-semibold opacity-70">{counts[option.value]}</span>
        </button>
      ))}
    </div>
  );
}
