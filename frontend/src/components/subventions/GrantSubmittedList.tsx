import GrantStatusBadge from '@/components/subventions/GrantStatusBadge';
import { IconSubvention } from '@/components/ui/icons';
import type { SubmittedGrant } from '@/lib/api';
import { formatGrantAmount, formatGrantDate } from '@/lib/grantApplication';

interface GrantSubmittedListProps {
  grants: SubmittedGrant[];
}

/** Dossiers transmis : ils ne sont plus modifiables et suivent la décision de la mairie. */
export default function GrantSubmittedList({ grants }: GrantSubmittedListProps) {
  return (
    <section aria-labelledby="grant-submitted-heading" className="mt-6 rounded-card border border-line bg-white p-6 shadow-xs sm:p-10">
      <header className="border-b border-line pb-5">
        <h2 id="grant-submitted-heading" className="text-2xl font-black tracking-tight text-ink">Demandes transmises</h2>
        <p className="mt-1 text-xs text-muted">Vous recevez un e-mail dès que la mairie rend sa décision.</p>
      </header>

      {grants.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {grants.map((grant) => {
            const sentOn = formatGrantDate(grant.updatedAt ?? grant.createdAt);
            return (
              <li key={grant.id} className="rounded-card border border-line bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-soft bg-Misty-Rose text-ink">
                    <IconSubvention className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-bold text-ink">{grant.intituleProjet}</span>
                    <span className="mt-1 block text-xs text-muted">
                      {grant.typeSubvention} · {formatGrantAmount(grant.montantDemande)} demandés
                      {sentOn && ` · ${grant.statut === 'Validée' || grant.statut === 'Refusée' ? 'décision le' : 'transmise le'} ${sentOn}`}
                    </span>
                  </span>
                  <GrantStatusBadge status={grant.statut} />
                </div>
                {grant.statut === 'Validée' && grant.montantAccorde && (
                  <p className="mt-4 rounded-soft bg-primary-soft px-4 py-3 text-sm font-bold text-primary">
                    Montant accordé : {formatGrantAmount(grant.montantAccorde)}
                  </p>
                )}
                {grant.observations && (
                  <p className="mt-3 whitespace-pre-line rounded-soft bg-paper px-4 py-3 text-sm text-ink">
                    <span className="block text-label font-bold uppercase tracking-label text-muted">Message de la mairie</span>
                    {grant.observations}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-6 rounded-card border border-dashed border-line bg-paper px-6 py-10 text-center text-sm text-muted">
          Aucune demande transmise pour le moment.
        </p>
      )}
    </section>
  );
}
