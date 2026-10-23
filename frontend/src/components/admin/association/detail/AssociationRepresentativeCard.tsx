import { type AssociationContact } from '@/lib/api';
import {
  IconPresidence,
  IconEmail,
  IconTelephone,
  IconInfo,
} from '@/components/ui/icons';

interface AssociationRepresentativeCardProps {
  contact?: AssociationContact | null;
}

export default function AssociationRepresentativeCard({
  contact,
}: AssociationRepresentativeCardProps) {
  const hasPresident = Boolean(contact?.prenom || contact?.nom);
  const fullName = hasPresident ? `${contact?.prenom ?? ''} ${contact?.nom ?? ''}`.trim() : null;
  const email = contact?.email || null;
  const telephone = contact?.telephone || null;

  return (
    <article className="rounded-card border border-line bg-white p-6 sm:p-7 shadow-xs">
      <header className="border-b border-line pb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink">
          Représentante et coordonnées
        </h2>
      </header>

      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <dt className="flex items-center gap-1.5 text-label font-bold uppercase tracking-wider text-muted">
            <IconPresidence className="h-3.5 w-3.5 text-primary" />
            <span>Représentante</span>
          </dt>
          <dd className="mt-1 text-sm font-bold text-ink">
            {fullName || 'Non renseigné'}
          </dd>
        </div>

        <div>
          <dt className="flex items-center gap-1.5 text-label font-bold uppercase tracking-wider text-muted">
            <IconInfo className="h-3.5 w-3.5 text-primary" />
            <span>Fonction</span>
          </dt>
          <dd className="mt-1 text-sm font-semibold text-ink">
            {hasPresident ? 'Présidente' : 'Non renseigné'}
          </dd>
        </div>

        <div>
          <dt className="flex items-center gap-1.5 text-label font-bold uppercase tracking-wider text-muted">
            <IconEmail className="h-3.5 w-3.5 text-primary" />
            <span>E-mail</span>
          </dt>
          <dd className="mt-1 text-sm font-bold text-ink">
            {email ? (
              <a
                href={`mailto:${email}`}
                className="hover:text-primary hover:underline"
              >
                {email}
              </a>
            ) : (
              <span className="font-semibold text-ink">Non renseigné</span>
            )}
          </dd>
        </div>

        <div>
          <dt className="flex items-center gap-1.5 text-label font-bold uppercase tracking-wider text-muted">
            <IconTelephone className="h-3.5 w-3.5 text-primary" />
            <span>Téléphone</span>
          </dt>
          <dd className="mt-1 text-sm font-bold text-ink">
            {telephone ? (
              <a
                href={`tel:${telephone}`}
                className="hover:text-primary hover:underline"
              >
                {telephone}
              </a>
            ) : (
              <span className="font-semibold text-ink">Non renseigné</span>
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
}
