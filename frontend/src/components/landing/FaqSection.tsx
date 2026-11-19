import Link from 'next/link';
import { IconPlus } from '@/components/ui/icons';
import LandingContainer from './ui/LandingContainer';
import SectionHeading from './ui/SectionHeading';
import { LANDING_FAQ, LANDING_SECTIONS } from './landingContent';

/** Questions fréquentes, en accordéons natifs (accessibles sans JavaScript). */
export default function FaqSection() {
  return (
    <section id={LANDING_SECTIONS.faq} aria-labelledby="faq-title" className="scroll-mt-24 bg-white py-20 sm:py-28">
      <LandingContainer className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeading id="faq-title" eyebrow="Questions" title="Les réponses avant de vous lancer." />
          <p className="mt-6 text-body leading-copy text-muted">
            Une autre question ?{' '}
            <Link href="/contact" className="font-bold text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary">
              Écrivez à la mairie
            </Link>
            .
          </p>
        </div>

        <div className="divide-y divide-line border-y border-line lg:col-span-8">
          {LANDING_FAQ.map((item) => (
            <details key={item.question} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-body-lg font-bold text-ink transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                {item.question}
                <span className="flex size-9 shrink-0 items-center justify-center rounded-pill border border-line text-ink transition-transform duration-300 group-open:rotate-45 group-open:border-primary group-open:bg-primary group-open:text-white">
                  <IconPlus className="size-4" />
                </span>
              </summary>
              <p className="max-w-2xl pb-6 text-body leading-copy text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </LandingContainer>
    </section>
  );
}
