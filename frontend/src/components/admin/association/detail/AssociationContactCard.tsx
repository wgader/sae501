import { type AssociationContact } from '@/lib/api';
import { IconPresidence, IconEmail, IconTelephone, IconInfo } from '@/components/ui/icons';

interface AssociationContactCardProps {
  contact?: AssociationContact | null;
}

export default function AssociationContactCard({ contact }: AssociationContactCardProps) {
  const hasPresident = Boolean(contact?.prenom || contact?.nom);
  const fullName = hasPresident ? `${contact?.prenom ?? ''} ${contact?.nom ?? ''}`.trim() : null;
  const email = contact?.email || null;
  const telephone = contact?.telephone || null;

  const hasInfo = Boolean(fullName || email || telephone);

  return (
    <article className="rounded-[20px] border border-[var(--line)] bg-[var(--White)] p-6 sm:p-8 shadow-xs">
      <h2 className="text-base font-bold uppercase tracking-wider text-[var(--ink)]">
        Coordonnées & Référent
      </h2>

      {hasInfo ? (
        <dl className="mt-4 space-y-4">
          {fullName && (
            <div className="flex items-start gap-3 rounded-[12px] bg-[var(--paper)] p-4">
              <IconPresidence className="mt-0.5 h-4 w-4 shrink-0 text-[var(--Mosaic-Tile)]" />
              <div>
                <dt className="text-xs font-semibold text-[var(--muted)]">Présidence / Contact</dt>
                <dd className="mt-0.5 text-sm font-bold text-[var(--ink)]">{fullName}</dd>
              </div>
            </div>
          )}

          {email && (
            <div className="flex items-start gap-3 rounded-[12px] bg-[var(--paper)] p-4">
              <IconEmail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--Mosaic-Tile)]" />
              <div>
                <dt className="text-xs font-semibold text-[var(--muted)]">Adresse e-mail</dt>
                <dd className="mt-0.5 text-sm font-bold text-[var(--ink)]">
                  <a
                    href={`mailto:${email}`}
                    className="hover:text-[var(--Mosaic-Tile)] hover:underline"
                  >
                    {email}
                  </a>
                </dd>
              </div>
            </div>
          )}

          {telephone && (
            <div className="flex items-start gap-3 rounded-[12px] bg-[var(--paper)] p-4">
              <IconTelephone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--Mosaic-Tile)]" />
              <div>
                <dt className="text-xs font-semibold text-[var(--muted)]">Numéro de téléphone</dt>
                <dd className="mt-0.5 text-sm font-bold text-[var(--ink)]">
                  <a
                    href={`tel:${telephone}`}
                    className="hover:text-[var(--Mosaic-Tile)] hover:underline"
                  >
                    {telephone}
                  </a>
                </dd>
              </div>
            </div>
          )}
        </dl>
      ) : (
        <div className="mt-4 flex items-center gap-2.5 rounded-[12px] bg-[var(--paper)] p-4 text-xs text-[var(--muted)]">
          <IconInfo className="h-4 w-4 shrink-0 text-[var(--Mosaic-Tile)]" />
          <span>Aucune coordonnée de contact direct n’a été renseignée pour cette structure.</span>
        </div>
      )}
    </article>
  );
}
