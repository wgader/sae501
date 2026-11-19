import { IconDownload } from '@/components/ui/icons';

const RESOURCES = [
  { label: 'Formulaire de subvention (Cerfa)', href: '/assets/cerfa_12156-06-1.pdf', isExternal: false },
  { label: 'Notice du formulaire', href: '/assets/notice_5178104-1.pdf', isExternal: false },
  {
    label: 'Contrat d’engagement républicain, affiche',
    href: 'https://www.ville-feytiat.fr/wp-content/uploads/2022/09/22-01-Contrat-Engagement-Republicain-affiche.pdf',
    isExternal: true,
  },
  {
    label: 'Décret n° 2021-1947 du 31 décembre 2021',
    href: 'https://www.ville-feytiat.fr/wp-content/uploads/2022/09/2021-12-decret-2021-1947-du-31-decembre-2021-_-contrat-dengagement-republicain.pdf',
    isExternal: true,
  },
];

const INSTRUCTIONS = [
  'La rubrique N° 6 n’est à remplir que si vous sollicitez le financement d’une action ou d’un projet ponctuel, anciennement appelé subvention exceptionnelle.',
  'Accompagnez votre demande d’un RIB et du rapport moral de la dernière assemblée générale. À défaut, fournissez un bilan de votre activité récente.',
  'Pour la partie financière, vous pouvez remplacer les tableaux du dossier par vos propres tableaux de présentation pour la rubrique N° 5, Budget de l’association.',
];

/** Modèles à télécharger et consignes de la mairie, affichés à côté du formulaire. */
export default function GrantResourcesPanel() {
  return (
    <aside aria-labelledby="grant-resources-heading" className="space-y-6 rounded-card bg-Misty-Rose p-6 sm:p-8">
      <section>
        <h2 id="grant-resources-heading" className="text-base font-black text-ink">Documents utiles</h2>
        <p className="mt-1 text-xs leading-copy text-ink/70">Téléchargez les modèles avant de compléter votre dossier.</p>
        <ul className="mt-4 space-y-2">
          {RESOURCES.map((resource) => (
            <li key={resource.href}>
              <a
                href={resource.href}
                {...(resource.isExternal ? { target: '_blank', rel: 'noreferrer' } : { download: true })}
                className="flex items-center justify-between gap-3 rounded-soft bg-white px-4 py-3 text-xs font-bold text-ink transition hover:shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span>{resource.label}</span>
                <IconDownload className="h-4 w-4 shrink-0 text-primary" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="grant-instructions-heading" className="border-t border-ink/10 pt-6">
        <h2 id="grant-instructions-heading" className="text-base font-black text-ink">Avant de déposer la demande</h2>
        <div className="mt-3 space-y-3 text-xs leading-copy text-ink/80">
          {INSTRUCTIONS.map((instruction) => <p key={instruction}>{instruction}</p>)}
          <p className="font-bold text-ink">Dans tous les cas, remplissez attentivement la rubrique N° 7 et signez la demande.</p>
          <p>
            La loi du 24 août 2021 instaure un contrat d’engagement républicain applicable aux associations ou fondations
            qui demandent une subvention, un agrément ou une reconnaissance d’utilité publique.
          </p>
        </div>
      </section>
    </aside>
  );
}
