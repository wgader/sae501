import Link from 'next/link';

export default function HistoriquePage() {
  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-[82rem]">
        <header className="border-b border-[#E7ECEB] pb-6">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[var(--Mosaic-Tile)]">
            Espace associations · Historique
          </p>
          <h1 className="mt-2 text-[clamp(2rem,3.5vw,2.75rem)] font-black tracking-[-0.03em] text-[var(--ink)]">
            Historique de vos démarches
          </h1>
          <p className="mt-2 max-w-2xl text-[0.9375rem] leading-[1.6] text-[var(--muted)]">
            Retrouvez l&apos;ensemble de vos demandes passées et actuelles auprès de la mairie de Feytiat.
          </p>
        </header>

        <section aria-labelledby="historique-status" className="mt-10">
          <h2 id="historique-status" className="sr-only">
            Liste de vos démarches
          </h2>

          <div className="rounded-[24px] border border-[#E7ECEB] bg-[#F7FAF8] p-8 sm:p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#CFEDE5] text-[var(--ink)]">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>

            <h3 className="mt-6 text-xl font-bold text-[var(--ink)]">
              Aucune démarche archivée
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
              Vos prochaines demandes de subventions, réservations de salles et demandes de matériel apparaîtront ici.
            </p>

            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[var(--Mosaic-Tile)] px-6 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[var(--moss)]"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
