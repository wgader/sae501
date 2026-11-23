import Link from 'next/link';
import { IconPlus } from '@/components/ui/icons';
import BrandDot from './ui/BrandDot';
import LandingContainer from './ui/LandingContainer';
import Reveal from './ui/Reveal';
import SectionTitle from './ui/SectionTitle';
import { LANDING_ANCHORS, LANDING_FAQ } from './landingContent';

/** Questions fréquentes en accordéons natifs, accessibles sans JavaScript. */
export default function FaqSection() {
  return (
    <section id={LANDING_ANCHORS.faq} aria-labelledby="faq-title" className="scroll-mt-28 bg-white py-24 sm:py-32">
      <LandingContainer className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-4">
          <SectionTitle id="faq-title" title={<>Questions<BrandDot /></>} />
          <p className="mt-4 text-body leading-copy text-muted">
            Autre chose ?{' '}
            <Link href="/contact" className="font-bold text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary">
              Écrivez à la mairie
            </Link>
          </p>
        </Reveal>

        <Reveal delay={0.1} className="space-y-3 lg:col-span-8">
          {LANDING_FAQ.map((item) => (
            <details key={item.question} className="group rounded-card bg-paper px-6 transition-colors open:bg-primary-soft/50">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-body-lg font-bold text-ink marker:hidden">
                {item.question}
                <span className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-white text-ink transition-transform duration-300 group-open:rotate-45 group-open:bg-primary group-open:text-white">
                  <IconPlus className="size-4" />
                </span>
              </summary>
              <p className="max-w-2xl pb-6 text-body leading-copy text-muted">{item.answer}</p>
            </details>
          ))}
        </Reveal>
      </LandingContainer>
    </section>
  );
}
