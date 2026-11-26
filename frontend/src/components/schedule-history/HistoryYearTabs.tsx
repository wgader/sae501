import { cva } from 'class-variance-authority';
import type { ScheduleHistoryYear } from '@/lib/api';

const yearVariants = cva(
  'flex shrink-0 cursor-pointer items-baseline gap-2 rounded-pill border px-4 py-2 text-body-sm font-bold transition-colors',
  {
    variants: {
      selected: {
        true: 'border-primary bg-primary text-white',
        false: 'border-line bg-white text-ink hover:border-primary hover:text-primary',
      },
    },
  },
);

interface HistoryYearTabsProps {
  years: ScheduleHistoryYear[];
  selected: number;
  onSelect: (year: number) => void;
}

/** Une pastille par année : on voit d’un coup les saisons disponibles et leur volume. */
export default function HistoryYearTabs({ years, selected, onSelect }: HistoryYearTabsProps) {
  return (
    <nav aria-label="Années" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {years.map(({ year, attributions }) => {
        const isSelected = year === selected;
        return (
          <button
            key={year}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(year)}
            className={yearVariants({ selected: isSelected })}
          >
            {year}
            <span className={isSelected ? 'text-caption text-white/80' : 'text-caption text-muted'}>{attributions.length}</span>
          </button>
        );
      })}
    </nav>
  );
}
