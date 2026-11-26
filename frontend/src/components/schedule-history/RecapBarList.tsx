import { shareOf } from '@/lib/scheduleHistory';

export interface RecapRow {
  key: number;
  label: string;
  value: number;
  valueLabel: string;
}

interface RecapBarListProps {
  title: string;
  rows: RecapRow[];
  emptyLabel: string;
}

/** Répartition sur l’année : nom et valeur sur une ligne, barre proportionnelle dessous. */
export default function RecapBarList({ title, rows, emptyLabel }: RecapBarListProps) {
  const max = Math.max(0, ...rows.map((row) => row.value));

  return (
    <section aria-label={title}>
      <h4 className="mb-3 text-label font-bold uppercase tracking-label text-muted">{title}</h4>
      {rows.length === 0 ? (
        <p className="text-xs italic text-muted">{emptyLabel}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.key} className="text-xs">
              <p className="flex items-baseline justify-between gap-3">
                <span className="truncate font-semibold text-ink">{row.label}</span>
                <span className="shrink-0 font-bold text-ink">{row.valueLabel}</span>
              </p>
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-pill bg-paper" aria-hidden="true">
                {/* Largeur calculée : seule valeur dynamique, impossible à exprimer en classe. */}
                <span className="block h-full rounded-pill bg-primary" style={{ width: `${shareOf(row.value, max)}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
