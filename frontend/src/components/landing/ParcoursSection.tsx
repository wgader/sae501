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
      <div className="mx-auto max-w-340 px-4 sm:px-8 lg:px-12">
        <div className="rounded-panel bg-primary px-6 py-10 sm:rounded-4xl sm:px-12 sm:py-14 lg:px-16 lg:py-20">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <header className="lg:col-span-6 xl:col-span-5">
              <p className="text-meta font-bold uppercase tracking-eyebrow text-accent">
                Un parcours clair
              </p>

              <h2
                id="parcours-heading"
                className="mt-3 text-[clamp(2.125rem,4.25vw,3.25rem)] font-black leading-[1.08] tracking-display text-white"
              >
                Simple dès la<br />
                première demande.
              </h2>

              <p className="mt-5 max-w-104 text-base leading-copy text-white/80 sm:text-body-lg">
                Votre compte devient le point de repère de l&apos;association pour
                toutes ses démarches avec la mairie de Feytiat.
              </p>

              <div className="mt-8 sm:mt-10">
                <Link
                  href="/inscription"
                  className="inline-flex h-control items-center gap-3 rounded-control bg-white px-7 text-xs font-bold uppercase tracking-label text-primary shadow-xs transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span>Ouvrir mon espace</span>
                  <span className="grid size-6 place-items-center rounded-full bg-primary text-white">
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
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-accent text-body-sm font-black text-accent">
                        {step.number}
                      </span>

                      <div>
                        <h3 className="text-lg font-bold leading-snug text-white">
                          {step.title}
                        </h3>
                        <p className="mt-1.5 text-body-sm leading-relaxed text-white/75 sm:text-body">
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
