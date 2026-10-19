'use client';

import Link from 'next/link';

const steps = [
  {
    number: '01',
    title: 'Inscrivez votre structure',
    description: 'Créez le compte de votre association avec vos informations essentielles.',
  },
  {
    number: '02',
    title: 'Déposez votre demande',
    description: 'Choisissez la démarche dont vous avez besoin et complétez la à votre rythme.',
  },
  {
    number: '03',
    title: 'Gardez le fil',
    description: 'Suivez son traitement et recevez chaque échange depuis un espace unique.',
  },
];

export default function ParcoursSection() {
  return (
    <section
      id="comment-ca-marche"
      aria-labelledby="parcours-heading"
      className="scroll-mt-24 py-12 sm:py-16"
    >
      <div className="mx-auto max-w-[85rem] px-4 sm:px-8 lg:px-12">
        <div className="rounded-[32px] bg-[var(--Mosaic-Tile)] px-6 py-10 sm:rounded-[40px] sm:px-12 sm:py-14 lg:px-16 lg:py-20">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <header className="lg:col-span-6 xl:col-span-5">
              <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[var(--Lime-Cream)]">
                Un parcours clair
              </p>

              <h2
                id="parcours-heading"
                className="mt-3 text-[clamp(2.125rem,4.25vw,3.25rem)] font-black leading-[1.08] tracking-[-0.03em] text-[var(--White)]"
              >
                Simple dès la<br />
                première demande.
              </h2>

              <p className="mt-5 max-w-[26rem] text-[1rem] leading-[1.6] text-[var(--White)]/80 sm:text-[1.0625rem]">
                Votre compte devient le point de repère de l&apos;association pour
                toutes ses démarches avec la mairie de Feytiat.
              </p>

              <div className="mt-8 sm:mt-10">
                <Link
                  href="/inscription"
                  className="inline-flex h-[3.125rem] items-center gap-3 rounded-[10px] bg-[var(--White)] px-7 text-xs font-bold uppercase tracking-[0.14em] text-[var(--Mosaic-Tile)] shadow-xs transition-colors hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span>Ouvrir mon espace</span>
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--Mosaic-Tile)] text-[var(--White)]">
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
              </div>
            </header>

            <div className="lg:col-span-6 xl:col-span-7">
              <ol className="flex flex-col">
                {steps.map((step, index) => (
                  <li key={step.number}>
                    <div className="flex items-start gap-5 py-6 sm:gap-6 sm:py-7">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[var(--Lime-Cream)] text-[0.875rem] font-black text-[var(--Lime-Cream)]">
                        {step.number}
                      </span>

                      <div>
                        <h3 className="text-[1.1875rem] font-bold leading-snug text-[var(--White)]">
                          {step.title}
                        </h3>
                        <p className="mt-1.5 text-[0.875rem] leading-[1.55] text-[var(--White)]/75 sm:text-[0.9375rem]">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {index < steps.length - 1 && (
                      <div className="border-t border-white/15" aria-hidden="true" />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
