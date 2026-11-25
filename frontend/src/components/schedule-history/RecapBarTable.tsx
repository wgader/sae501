import { shareOf } from '@/lib/scheduleHistory';

export interface RecapRow {
  key: number;
  label: string;
  count: string;
  value: number;
  valueLabel: string;
}

interface RecapBarTableProps {
  caption: string;
  columns: [string, string, string];
  rows: RecapRow[];
  emptyLabel: string;
}

/** Tableau récapitulatif : chaque ligne porte une barre proportionnelle à sa valeur. */
export default function RecapBarTable({ caption, columns, rows, emptyLabel }: RecapBarTableProps) {
  const max = Math.max(0, ...rows.map((row) => row.value));

  return (
    <figure className="rounded-soft border border-line bg-white p-5">
      <table className="w-full text-left text-body-sm">
        <caption className="mb-3 text-left text-label font-bold uppercase tracking-label text-ink">{caption}</caption>
        <thead>
          <tr className="border-b border-line text-label uppercase text-muted">
            <th scope="col" className="pb-2 font-bold">{columns[0]}</th>
            <th scope="col" className="pb-2 text-right font-bold">{columns[1]}</th>
            <th scope="col" className="w-1/2 pb-2 pl-4 font-bold">{columns[2]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="py-4 text-muted">{emptyLabel}</td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-line/60 last:border-0">
              <th scope="row" className="py-3 pr-2 font-semibold text-ink">{row.label}</th>
              <td className="py-3 text-right text-muted">{row.count}</td>
              <td className="py-3 pl-4">
                <span className="flex items-center gap-3">
                  <span className="h-2 flex-1 overflow-hidden rounded-pill bg-paper" aria-hidden="true">
                    {/* Largeur calculée : seule valeur dynamique, impossible à exprimer en classe. */}
                    <span className="block h-full rounded-pill bg-primary" style={{ width: `${shareOf(row.value, max)}%` }} />
                  </span>
                  <span className="w-14 text-right font-bold text-ink">{row.valueLabel}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
