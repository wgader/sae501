import Link from 'next/link';

export default function EvenementsPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-328">
        <header className="border-b border-line pb-6">
          <p className="text-label font-bold uppercase tracking-eyebrow text-primary">
            Espace associations · Événements
          </p>
          <h1 className="mt-2 text-[clamp(1.875rem,3.2vw,2.5rem)] font-black tracking-display text-ink">
            Déclaration d&apos;événements associatifs
          </h1>
          <p className="mt-2 max-w-2xl text-body leading-copy text-muted">
            Informez les services municipaux de la tenue de vos manifestations, tournois et rassemblements publics.
          </p>
        </header>

        <section aria-labelledby="evenements-status" className="mt-8">
          <h2 id="evenements-status" className="sr-only">
            Statut des déclarations
          </h2>

          <div className="rounded-2xl border border-line bg-paper p-8 sm:p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-ink">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>

            <h3 className="mt-6 text-xl font-bold text-ink">
              Vos manifestations et rassemblements
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Déclarez un nouvel événement associatif ou suivez l&apos;instruction des déclarations en cours.
            </p>

            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-xs font-bold uppercase tracking-label text-white transition-colors hover:bg-primary-hover"
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
