import { type Association } from '@/lib/api';

interface InscriptionStructureCardProps {
  association: Association;
  formattedDate: string;
}

export default function InscriptionStructureCard({
  association,
  formattedDate,
}: InscriptionStructureCardProps) {
  return (
    <article className="rounded-card border border-line bg-white p-6 sm:p-7 shadow-xs">
      <header className="flex items-center gap-3 border-b border-line pb-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-control bg-primary/10 text-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </span>
        <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
          Structure associative
        </h3>
      </header>

      <dl className="mt-5 space-y-4 text-xs">
        <div>
          <dt className="text-label font-medium text-muted">Nom officiel</dt>
          <dd className="mt-1 text-sm font-bold text-ink">{association.nom}</dd>
        </div>
        <div>
          <dt className="text-label font-medium text-muted">Numéro RNA</dt>
          <dd className="mt-1 text-sm font-semibold text-ink">
            {association.numeroRna || 'Non communiqué'}
          </dd>
        </div>
        <div>
          <dt className="text-label font-medium text-muted">Date & heure de soumission</dt>
          <dd className="mt-1 text-sm font-semibold text-ink">{formattedDate}</dd>
        </div>
      </dl>
    </article>
  );
}
