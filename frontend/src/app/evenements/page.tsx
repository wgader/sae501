import Link from 'next/link';

export default function EvenementsPage() {
  return (
    <main className="min-h-screen bg-[var(--White)] px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-[82rem]">
        <header className="border-b border-[var(--line)] pb-6">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[var(--Mosaic-Tile)]">
            Espace associations · Événements
          </p>
          <h1 className="mt-2 text-[clamp(1.875rem,3.2vw,2.5rem)] font-black tracking-[-0.03em] text-[var(--ink)]">
            Déclaration d&apos;événements associatifs
          </h1>
          <p className="mt-2 max-w-2xl text-[0.9375rem] leading-[1.6] text-[var(--muted)]">
            Informez les services municipaux de la tenue de vos manifestations, tournois et rassemblements publics.
          </p>
        </header>

        <section aria-labelledby="evenements-status" className="mt-8">
          <h2 id="evenements-status" className="sr-only">
            Statut des déclarations
          </h2>

          <div className="rounded-[20px] border border-[var(--line)] bg-[var(--paper)] p-8 sm:p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--Mint-Cream)] text-[var(--ink)]">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>

            <h3 className="mt-6 text-xl font-bold text-[var(--ink)]">
              Vos manifestations et rassemblements
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
              Déclarez un nouvel événement associatif ou suivez l&apos;instruction des déclarations en cours.
            </p>

            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[var(--Mosaic-Tile)] px-6 text-xs font-bold uppercase tracking-[0.14em] text-[var(--White)] transition-opacity hover:opacity-90"
              >
                Retour au tableau de bord
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
