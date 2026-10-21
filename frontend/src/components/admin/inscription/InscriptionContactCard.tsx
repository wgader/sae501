import { type Association } from '@/lib/api';

interface InscriptionContactCardProps {
  contact: Association['contact'];
}

export default function InscriptionContactCard({ contact }: InscriptionContactCardProps) {
  return (
    <article className="rounded-[20px] border border-[var(--line)] bg-[var(--White)] p-6 sm:p-7 shadow-xs">
      <header className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--Lime-Cream)] text-[var(--ink)]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </span>
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
          Président & Correspondant
        </h3>
      </header>

      {contact ? (
        <dl className="mt-5 space-y-4 text-xs">
          <div>
            <dt className="text-[0.6875rem] font-medium text-[var(--muted)]">Nom et Prénom</dt>
            <dd className="mt-1 text-sm font-bold text-[var(--ink)]">
              {contact.prenom} {contact.nom}
            </dd>
          </div>
          <div>
            <dt className="text-[0.6875rem] font-medium text-[var(--muted)]">Adresse électronique</dt>
            <dd className="mt-1">
              <a
                href={`mailto:${contact.email}`}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--Mosaic-Tile)] underline underline-offset-2 hover:opacity-85"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{contact.email}</span>
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-[0.6875rem] font-medium text-[var(--muted)]">Numéro de téléphone</dt>
            <dd className="mt-1">
              {contact.telephone ? (
                <a
                  href={`tel:${contact.telephone}`}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--ink)] hover:text-[var(--Mosaic-Tile)]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{contact.telephone}</span>
                </a>
              ) : (
                <span className="text-sm text-[var(--muted)]">Non renseigné</span>
              )}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-5 text-xs text-[var(--muted)]">Aucun contact principal associé à cette demande.</p>
      )}
    </article>
  );
}
