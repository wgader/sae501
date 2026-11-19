import { cva } from 'class-variance-authority';
import CheckList from './ui/CheckList';
import LandingContainer from './ui/LandingContainer';
import SectionHeading from './ui/SectionHeading';
import { LANDING_SECTIONS, LANDING_SERVICES, type LandingService } from './landingContent';

const serviceCardVariants = cva('group flex h-full flex-col rounded-panel p-7 transition-transform duration-300 hover:-translate-y-1 sm:p-9', {
  variants: {
    tone: {
      grants: 'bg-module-grants text-ink',
      rooms: 'bg-module-rooms text-ink',
      equipment: 'bg-module-equipment text-white',
      events: 'bg-module-events text-ink',
    },
  },
});

const serviceIconVariants = cva('flex size-12 items-center justify-center rounded-soft', {
  variants: {
    tone: {
      grants: 'bg-white text-ink',
      rooms: 'bg-white text-ink',
      equipment: 'bg-white/15 text-white',
      events: 'bg-white text-primary',
    },
  },
});

/** Les quatre démarches, chacune dans la couleur de son module. */
export default function ServicesSection() {
  return (
    <section id={LANDING_SECTIONS.services} aria-labelledby="services-title" className="scroll-mt-24 bg-white py-20 sm:py-28">
      <LandingContainer>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading id="services-title" eyebrow="Les démarches" title="Quatre démarches, un seul compte pour votre association.">
            Tout ce que votre association demande à la mairie se prépare, se dépose et se suit au même endroit.
          </SectionHeading>
        </div>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2">
          {LANDING_SERVICES.map((service) => (
            <ServiceCard key={service.tone} service={service} />
          ))}
        </ul>
      </LandingContainer>
    </section>
  );
}

function ServiceCard({ service }: { service: LandingService }) {
  const Icon = service.icon;

  return (
    <li>
      <article className={serviceCardVariants({ tone: service.tone })}>
        <div className="flex items-center justify-between gap-4">
          <span className={serviceIconVariants({ tone: service.tone })}>
            <Icon className="size-6" />
          </span>
          <span className="text-label font-bold uppercase tracking-eyebrow opacity-70">{service.kicker}</span>
        </div>
        <h3 className="mt-10 font-display text-3xl leading-tight font-normal tracking-subheading">{service.title}</h3>
        <p className="mt-3 mb-8 max-w-md text-body leading-copy opacity-80">{service.description}</p>
        <CheckList items={service.features} kind="onTone" className="mt-auto border-t border-current/15 pt-6 [&_li]:opacity-90" />
      </article>
    </li>
  );
}
