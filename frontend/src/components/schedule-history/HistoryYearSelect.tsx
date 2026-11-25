import { IconPlus } from '@/components/ui/icons';

interface HistoryYearSelectProps {
  years: number[];
  value: number;
  onChange: (year: number) => void;
}

/** Choix de l’année affichée, présenté comme un champ (maquette : libellé « Année » et signe +). */
export default function HistoryYearSelect({ years, value, onChange }: HistoryYearSelectProps) {
  return (
    <div className="w-full sm:w-60">
      <label htmlFor="history-year" className="block text-label font-bold uppercase text-muted">
        Année
      </label>
      <div className="relative mt-2">
        <select
          id="history-year"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-control w-full cursor-pointer appearance-none rounded-control border border-line bg-white px-5 text-body-lg font-bold text-primary outline-none transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {years.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <IconPlus className="pointer-events-none absolute right-5 top-1/2 size-5 -translate-y-1/2 text-primary" />
      </div>
    </div>
  );
}
