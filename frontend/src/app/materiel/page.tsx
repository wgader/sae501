import Link from 'next/link';

export default function MaterielPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-[82rem]">
        <header className="border-b border-[#E7ECEB] pb-6">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[var(--Mosaic-Tile)]">
            Espace associations · Matériel
          </p>
          <h1 className="mt-2 text-[clamp(2rem,3.5vw,2.75rem)] font-black tracking-[-0.03em] text-[var(--ink)]">
            Demande de matériel
          </h1>
          <p className="mt-2 max-w-2xl text-[0.9375rem] leading-[1.6] text-[var(--muted)]">
            Sollicitez le prêt d&apos;équipements municipaux pour vos manifestations associatives.
          </p>
        </header>

        <section aria-labelledby="materiel-status" className="mt-10">
          <h2 id="materiel-status" className="sr-only">
            Inventaire et demandes
          </h2>

          <div className="rounded-[24px] border border-[#E7ECEB] bg-[#F7FAF8] p-8 sm:p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5B34A3] text-white">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>

            <h3 className="mt-6 text-xl font-bold text-[var(--ink)]">
              Catalogue de matériel municipal
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
              Grilles d&apos;exposition, barnums, tables, chaises et matériel de sonorisation.
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
