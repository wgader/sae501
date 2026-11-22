import type { ReactNode } from 'react';

export interface WishSummaryRow {
  key: string | number;
  salle: string;
  day: string;
  hours: string;
  frequency: string;
  activity: string;
  audience: string;
  attendance: number;
  status?: ReactNode;
  note?: string | null;
}

/** Récapitulatif des vœux : tableau sur grand écran, cartes empilées sur mobile. */
export default function WishSummaryTable({ rows, caption }: { rows: WishSummaryRow[]; caption: string }) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-white">
      <table className="w-full text-left text-body-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-paper text-label font-bold uppercase tracking-label text-muted max-md:hidden">
          <tr>
            <th scope="col" className="px-4 py-3">Salle</th>
            <th scope="col" className="px-4 py-3">Créneau</th>
            <th scope="col" className="px-4 py-3">Activité</th>
            <th scope="col" className="px-4 py-3">Public</th>
            {rows.some((row) => row.status) && <th scope="col" className="px-4 py-3">Statut</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={row.key} className="align-top max-md:grid max-md:gap-1 max-md:p-4">
              <td className="px-4 py-3 font-bold text-ink max-md:p-0">{row.salle}</td>
              <td className="px-4 py-3 text-ink max-md:p-0">
                {row.day} · {row.hours}
                <span className="block text-meta text-muted">{row.frequency}</span>
              </td>
              <td className="px-4 py-3 text-ink max-md:p-0">
                {row.activity}
                {row.note && <span className="block text-meta text-muted">{row.note}</span>}
              </td>
              <td className="px-4 py-3 text-ink max-md:p-0">
                {row.audience}
                <span className="block text-meta text-muted">{row.attendance} pers.</span>
              </td>
              {row.status && <td className="px-4 py-3 max-md:p-0 max-md:pt-2">{row.status}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
