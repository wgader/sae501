import Image from 'next/image';
import LandingContainer from './ui/LandingContainer';
import SectionHeading from './ui/SectionHeading';
import { LANDING_SECTIONS, LANDING_STEPS } from './landingContent';

/** Les trois étapes, de l'inscription à la réponse de la mairie. */
export default function ProcessSection() {
  return (
    <section id={LANDING_SECTIONS.process} aria-labelledby="process-title" className="scroll-mt-24 bg-primary py-20 text-white sm:py-28">
      <LandingContainer className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeading id="process-title" tone="dark" eyebrow="Fonctionnement" title="De l’inscription à la réponse de la mairie.">
            Un compte par association, validé par la mairie. Ensuite, chaque demande suit le même chemin clair.
          </SectionHeading>
          <div className="relative mt-12 hidden aspect-4/3 overflow-hidden rounded-panel lg:block">
            <Image
              src="/landing/dossier-association.jpg"
              alt="Le président et la trésorière d’une association préparent un dossier sur un ordinateur portable."
              fill
              sizes="(min-width: 1024px) 35vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        <ol className="lg:col-span-7 lg:pt-4">
          {LANDING_STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-6 border-t border-white/15 py-9 first:border-t-0 first:pt-0 sm:gap-10">
              <span className="w-16 shrink-0 font-display text-6xl leading-none font-light text-accent sm:w-20 sm:text-7xl" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="pt-1">
                <h3 className="text-xl font-bold sm:text-2xl">
                  <span className="sr-only">Étape {index + 1} : </span>
                  {step.title}
                </h3>
                <p className="mt-3 max-w-md text-body leading-copy text-white/75">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </LandingContainer>
    </section>
  );
}
