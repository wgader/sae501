import { IconArrowRight } from '@/components/ui/icons';
import CheckList from './ui/CheckList';
import LandingContainer from './ui/LandingContainer';
import SectionHeading from './ui/SectionHeading';
import { CITY_WEBSITE_URL, LANDING_AUDIENCE, LANDING_SECTIONS } from './landingContent';

/** Lève l'ambiguïté : l'espace sert aux associations, pas aux habitants. */
export default function AudienceSection() {
  return (
    <section id={LANDING_SECTIONS.audience} aria-labelledby="audience-title" className="scroll-mt-24 bg-paper py-20 sm:py-28">
      <LandingContainer>
        <SectionHeading id="audience-title" eyebrow="Pour qui ?" title="Un espace pensé pour les associations, et seulement pour elles." align="center">
          Il réunit les démarches propres à la vie associative. Les autres démarches restent sur le site de la ville.
        </SectionHeading>

        <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-5">
          <article className="rounded-panel border border-primary/15 bg-white p-8 shadow-card md:col-span-3 sm:p-10">
            <p className="text-label font-bold uppercase tracking-eyebrow text-primary">Cet espace est fait pour</p>
            <CheckList items={LANDING_AUDIENCE.forWhom} className="mt-6 text-ink" />
          </article>

          <article className="flex flex-col rounded-panel border border-line bg-paper p-8 md:col-span-2 sm:p-10">
            <p className="text-label font-bold uppercase tracking-eyebrow text-muted">Il n’est pas prévu pour</p>
            <CheckList items={LANDING_AUDIENCE.notForWhom} kind="no" className="mt-6 text-muted" />
            <a
              href={CITY_WEBSITE_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 text-meta font-bold uppercase tracking-label text-ink transition-colors hover:text-primary md:mt-auto md:pt-8"
            >
              Site de la ville de Feytiat
              <IconArrowRight className="size-4" />
            </a>
          </article>
        </div>
      </LandingContainer>
    </section>
  );
}
