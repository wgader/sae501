'use client';

import Link from 'next/link';

export default function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex min-h-[calc(100vh-4.75rem)] items-center overflow-hidden bg-linear-to-b from-paper via-paper/50 to-white py-10 lg:py-16"
    >
      <span
        className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full border-ring border-white/70 sm:h-80 sm:w-80 lg:border-white/80"
        aria-hidden="true"
      />

      <div className="mx-auto w-full max-w-340 px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <header className="lg:col-span-6 xl:col-span-6">
            <p className="text-label font-bold uppercase tracking-eyebrow text-ink/80 sm:text-meta">
              Espace associations
            </p>

            <h1
              id="hero-title"
              className="mt-4 text-[clamp(2.75rem,5.2vw,4.5rem)] font-black leading-none tracking-heading text-ink"
            >
              Vos démarches,<br />
              en un seul endroit.
            </h1>

            <p className="mt-6 max-w-136 text-base leading-copy text-ink/80 sm:text-body-lg">
              Un espace simple pour centraliser vos démarches auprès de la
              mairie, suivre leur avancement et consacrer plus de temps à vos
              projets associatifs.
            </p>

            <nav aria-label="Actions principales du hero" className="mt-8 flex flex-wrap items-center gap-4 sm:gap-5">
              <Link
                href="/inscription"
                className="inline-flex h-control items-center gap-3 rounded-control bg-primary px-7 text-xs font-bold uppercase tracking-label text-white shadow-xs transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:bg-primary-hover"
              >
                <span>Créer mon espace</span>
                <span className="grid size-6 place-items-center rounded-full bg-black/35 text-white">
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>

              <a
                href="#demarches"
                className="inline-flex h-control items-center rounded-control border border-ink/25 px-6 text-xs font-bold uppercase tracking-label text-ink transition-colors hover:border-ink hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Découvrir les démarches
              </a>
            </nav>
          </header>

          <aside
            aria-label="Aperçu de l'interface association"
            className="relative flex justify-center lg:col-span-6 lg:justify-end xl:col-span-6"
          >
            <figure
              className="relative w-full max-w-136 rounded-panel-soft border border-line bg-white p-5 shadow-panel transition-transform duration-300 hover:scale-card-hover sm:p-7"
            >
              <figcaption className="flex items-center justify-between border-b border-line/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-full bg-accent text-label font-black text-ink">
                    AF
                  </span>
                  <span className="text-xs font-semibold text-ink">
                    Association Feytiat Loisirs
                  </span>
                </div>

                <span className="h-2 w-2 rounded-full bg-emerald-500" title="En ligne" />
              </figcaption>

              <div className="mt-5 grid grid-cols-12 gap-5">
                <nav
                  aria-label="Navigation miniature"
                  className="col-span-4 hidden flex-col gap-1.5 border-r border-line/60 pr-3 sm:flex"
                >
                  <div className="flex items-center gap-2 rounded-control bg-primary px-3 py-2 text-xs font-bold text-white shadow-xs">
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                    <span>Accueil</span>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted">
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    <span>Subventions</span>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted">
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 21h18M5 21V7l7-4 7 4v14" />
                    </svg>
                    <span>Salles</span>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted">
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    <span>Matériel</span>
                  </div>
                </nav>

                <section className="col-span-12 sm:col-span-8">
                  <p className="text-caption font-bold uppercase tracking-section text-muted">
                    Espace associations
                  </p>
                  <p className="mt-1 text-xl font-black tracking-subheading text-ink">
                    Bonjour, Feytiat Loisirs
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <article className="rounded-control border border-line bg-sage/40 p-3">
                      <p className="text-3xl font-black leading-none text-primary">
                        3
                      </p>
                      <p className="mt-1.5 text-label font-semibold leading-tight text-ink/85">
                        Demandes en cours
                      </p>
                    </article>

                    <article className="rounded-control border border-line bg-sage/30 p-3">
                      <p className="text-3xl font-black leading-none text-primary">
                        8
                      </p>
                      <p className="mt-1.5 text-label font-semibold leading-tight text-ink/85">
                        Démarches terminées
                      </p>
                    </article>
                  </div>

                  <article className="mt-3.5 flex items-center justify-between rounded-control border border-line bg-paper p-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 items-center justify-center rounded-control bg-primary/10 text-primary">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-bold leading-tight text-ink">
                          Subvention municipale
                        </p>
                        <p className="text-label text-muted">
                          2024 · Total: 1 500,00 €
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-accent px-2.5 py-1 text-caption font-black uppercase tracking-wider text-ink">
                      Validée
                    </span>
                  </article>
                </section>
              </div>
            </figure>
          </aside>
        </div>
      </div>
    </section>
  );
}
