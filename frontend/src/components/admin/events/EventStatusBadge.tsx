const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  VALIDATED: 'Validé',
  ACCEPTED: 'Validé',
  REFUSED: 'Refusé',
  REJECTED: 'Refusé',
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-800',
  VALIDATED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  ACCEPTED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  REFUSED: 'border-rose-200 bg-rose-50 text-rose-800',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-800',
};

export default function EventStatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toUpperCase();

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${STATUS_STYLES[normalizedStatus] ?? 'border-slate-200 bg-slate-50 text-slate-700'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[normalizedStatus] ?? status}
    </span>
  );
}
