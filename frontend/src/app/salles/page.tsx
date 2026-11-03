import Link from "next/link";

export default function SallesPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-328">
        <header className="border-b border-line pb-6">
          <p className="text-label font-bold uppercase tracking-eyebrow text-primary">
            Espace associations · Salles
          </p>
          <h1 className="mt-2 text-[clamp(2rem,3.5vw,2.75rem)] font-black tracking-display text-ink">
            Réservation de salles municipales
          </h1>
          <p className="mt-2 max-w-2xl text-body leading-copy text-muted">
            Consultez les disponibilités et effectuez vos demandes de créneaux
            dans les équipements de Feytiat.
          </p>
        </header>

        <section aria-labelledby="salles-status" className="mt-10">
          <h2 id="salles-status" className="sr-only">
            Planning des salles
          </h2>

          <div className="rounded-panel border border-line bg-paper p-8 sm:p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-ink">
              <svg
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 21h18" />
                <path d="M5 21V7l7-4 7 4v14" />
                <path d="M9 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                <path d="M15 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
              </svg>
            </div>

            <h3 className="mt-6 text-xl font-bold text-ink">
              Espaces municipaux disponibles
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Retrouvez l&apos;Espace Georges Brassens, le gymnase municipal et
              les salles polyvalentes.
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
