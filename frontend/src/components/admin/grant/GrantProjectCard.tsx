import RequestInfoField from '@/components/admin/equipment/request/RequestInfoField';
import type { AdminGrantDetail } from '@/lib/api';
import { formatGrantAmount, formatGrantDate } from '@/lib/grantApplication';

/** Contenu du dossier tel que saisi par l'association. */
export default function GrantProjectCard({ grant }: { grant: AdminGrantDetail }) {
  const budgetLines = grant.lignesBudget.filter((line) => line.categorie !== 'subvention_mairie');

  return (
    <section aria-labelledby="grant-project-title" className="rounded-card border border-line bg-white p-5 sm:p-6">
      <h2 id="grant-project-title" className="text-lg font-black text-ink">Projet</h2>
      <dl className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
        <RequestInfoField label="Intitulé">{grant.intituleProjet}</RequestInfoField>
        <RequestInfoField label="Type d’aide">{grant.typeSubvention} · exercice {grant.anneeExercice}</RequestInfoField>
        <RequestInfoField label="Période">
          {formatGrantDate(grant.dateDebutProjet) ?? 'Non renseignée'} → {formatGrantDate(grant.dateFinProjet) ?? 'Non renseignée'}
        </RequestInfoField>
        <RequestInfoField label="Montant demandé">{formatGrantAmount(grant.montantDemande)}</RequestInfoField>
        <div className="sm:col-span-2">
          <RequestInfoField label="Objectifs">
            <span className="whitespace-pre-line font-normal">{grant.description || 'Non renseignés'}</span>
          </RequestInfoField>
        </div>
        <div className="sm:col-span-2">
          <RequestInfoField label="Public cible">
            <span className="whitespace-pre-line font-normal">{grant.publicCible || 'Non renseigné'}</span>
          </RequestInfoField>
        </div>
      </dl>

      {budgetLines.length > 0 && (
        <div className="mt-6 border-t border-line pt-4">
          <h3 className="text-label font-bold uppercase tracking-label text-muted">Budget prévisionnel</h3>
          <ul className="mt-3 divide-y divide-line rounded-soft border border-line">
            {budgetLines.map((line, index) => (
              <li key={`${line.type}-${index}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-body-sm">
                <span className="min-w-0 truncate text-ink">
                  <span className="text-muted">{line.type === 'depense' ? 'Dépense' : 'Recette'} · </span>
                  {line.intitule}
                </span>
                <span className="shrink-0 font-semibold text-ink">{formatGrantAmount(line.montant)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
