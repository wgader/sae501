import Link from 'next/link';

export default function SubventionsPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-328">
        <header className="border-b border-line pb-6">
          <p className="text-label font-bold uppercase tracking-eyebrow text-primary">
            Espace associations · Subventions
          </p>
          <h1 className="mt-2 text-[clamp(2rem,3.5vw,2.75rem)] font-black tracking-display text-ink">
            Demandes de subvention
          </h1>
          <p className="mt-2 max-w-2xl text-body leading-copy text-muted">
            Déposez et suivez vos dossiers de subventions annuelles et exceptionnelles auprès de la ville de Feytiat.
          </p>
        </header>

        <section aria-labelledby="subventions-status" className="mt-10">
          <h2 id="subventions-status" className="sr-only">
            État de vos subventions
          </h2>

          <div className="rounded-panel border border-line bg-paper p-8 sm:p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-ink">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>

            <h3 className="mt-6 text-xl font-bold text-ink">
              Campagne de subventions 2026
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Aucun dossier déposé pour le moment. Vous pouvez consulter les critères d&apos;attribution et préparer vos pièces justificatives.
            </p>

            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-xs font-bold uppercase tracking-label text-white transition-colors hover:bg-primary-hover"
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
