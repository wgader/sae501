import BrandDot from './ui/BrandDot';
import LandingContainer from './ui/LandingContainer';
import Reveal from './ui/Reveal';
import SectionTitle from './ui/SectionTitle';
import { LANDING_ANCHORS, LANDING_STEPS } from './landingContent';

/** Trois étapes, reliées par une ligne : de l'inscription aux premières demandes. */
export default function StepsSection() {
  return (
    <section id={LANDING_ANCHORS.steps} aria-labelledby="steps-title" className="scroll-mt-28 bg-paper py-24 sm:py-32">
      <LandingContainer>
        <Reveal>
          <SectionTitle id="steps-title" align="center" title={<>Prêt en trois étapes<BrandDot /></>} />
        </Reveal>

        <ol className="relative mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
          <span aria-hidden="true" className="absolute top-7 right-1/6 left-1/6 hidden border-t-2 border-dashed border-line md:block" />
          {LANDING_STEPS.map((step, index) => (
            <li key={step.title} className="relative text-center">
              <Reveal delay={index * 0.12}>
                <span
                  className={`mx-auto flex size-14 items-center justify-center rounded-pill text-xl font-black ${
                    index === LANDING_STEPS.length - 1 ? 'bg-brand-dot text-white' : 'border-2 border-line bg-white text-ink'
                  }`}
                >
                  {index + 1}
                </span>
                <h3 className="mt-6 text-xl font-black text-ink">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-60 text-body leading-copy text-muted">{step.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </LandingContainer>
    </section>
  );
}
