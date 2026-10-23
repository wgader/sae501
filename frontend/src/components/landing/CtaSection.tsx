'use client';

import Link from 'next/link';

export default function CtaSection() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="py-12 sm:py-16"
    >
      <div className="mx-auto max-w-340 px-4 sm:px-8 lg:px-12">
        <div className="relative overflow-hidden rounded-panel bg-sage px-6 py-10 sm:rounded-panel-soft sm:px-12 sm:py-14 lg:px-16 lg:py-16">
          <div
            className="pointer-events-none absolute -bottom-14 -right-14 h-48 w-48 rounded-full border-18 border-white/70"
            aria-hidden="true"
          />

          <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
            <header className="lg:col-span-7">
              <p className="text-meta font-bold uppercase tracking-eyebrow text-primary">
                Prêt à commencer ?
              </p>

              <h2
                id="cta-heading"
                className="mt-2 text-[clamp(2.125rem,4vw,3.25rem)] font-black leading-[1.05] tracking-heading text-ink"
              >
                Vos projets font<br />
                vivre Feytiat.
              </h2>
            </header>

            <div className="lg:col-span-5">
              <p className="text-body leading-copy text-ink/85 sm:text-base">
                Rejoignez l&apos;espace associations et simplifiez vos échanges
                avec la mairie dès aujourd&apos;hui.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4 sm:gap-5">
                <Link
                  href="/inscription"
                  className="inline-flex h-12 items-center justify-center rounded-control bg-primary px-7 text-xs font-bold uppercase tracking-label text-white shadow-xs transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Créer mon compte
                </Link>

                <Link
                  href="/connexion"
                  className="inline-flex h-12 items-center justify-center rounded-control border border-ink/30 px-6 text-xs font-bold uppercase tracking-label text-ink transition-colors hover:border-ink hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  J&apos;ai déjà un compte
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
