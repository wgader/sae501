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
    <article className="rounded-[14px] border border-[var(--line)] bg-[var(--White)] p-6 sm:p-7 shadow-xs">
      <header className="border-b border-[var(--line)] pb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
          Représentante et coordonnées
        </h2>
      </header>

      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <dt className="flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--muted)]">
            <IconPresidence className="h-3.5 w-3.5 text-[var(--Mosaic-Tile)]" />
            <span>Représentante</span>
          </dt>
          <dd className="mt-1 text-sm font-bold text-[var(--ink)]">
            {fullName || 'Non renseigné'}
          </dd>
        </div>

        <div>
          <dt className="flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--muted)]">
            <IconInfo className="h-3.5 w-3.5 text-[var(--Mosaic-Tile)]" />
            <span>Fonction</span>
          </dt>
          <dd className="mt-1 text-sm font-semibold text-[var(--ink)]">
            {hasPresident ? 'Présidente' : 'Non renseigné'}
          </dd>
        </div>

        <div>
          <dt className="flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--muted)]">
            <IconEmail className="h-3.5 w-3.5 text-[var(--Mosaic-Tile)]" />
            <span>E-mail</span>
          </dt>
          <dd className="mt-1 text-sm font-bold text-[var(--ink)]">
            {email ? (
              <a
                href={`mailto:${email}`}
                className="hover:text-[var(--Mosaic-Tile)] hover:underline"
              >
                {email}
              </a>
            ) : (
              <span className="font-semibold text-[var(--ink)]">Non renseigné</span>
            )}
          </dd>
        </div>

        <div>
          <dt className="flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--muted)]">
            <IconTelephone className="h-3.5 w-3.5 text-[var(--Mosaic-Tile)]" />
            <span>Téléphone</span>
          </dt>
          <dd className="mt-1 text-sm font-bold text-[var(--ink)]">
            {telephone ? (
              <a
                href={`tel:${telephone}`}
                className="hover:text-[var(--Mosaic-Tile)] hover:underline"
              >
                {telephone}
              </a>
            ) : (
              <span className="font-semibold text-[var(--ink)]">Non renseigné</span>
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
}
