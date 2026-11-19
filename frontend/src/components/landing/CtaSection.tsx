import { IconArrowRight } from '@/components/ui/icons';
import LandingContainer from './ui/LandingContainer';
import LandingLink from './ui/LandingLink';

/** Dernier appel à l'action, avant le pied de page. */
export default function CtaSection() {
  return (
    <section aria-labelledby="cta-title" className="bg-white pb-20 sm:pb-28">
      <LandingContainer>
        <div className="relative isolate overflow-hidden rounded-panel bg-accent px-7 py-14 sm:px-14 sm:py-20">
          <div aria-hidden="true" className="absolute -top-24 -right-24 -z-10 size-80 rounded-pill border-ring border-white/50" />
          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="text-label font-bold uppercase tracking-eyebrow text-primary">Prêt à commencer ?</p>
              <h2 id="cta-title" className="mt-4 font-display text-4xl leading-heading font-normal tracking-display text-balance text-ink sm:text-6xl">
                Votre association n’a pas encore son espace&nbsp;?
              </h2>
              <p className="mt-5 max-w-xl text-body-lg leading-copy text-ink/75">
                L’inscription ne demande que quelques informations. La mairie active ensuite votre compte.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:col-span-4 lg:items-end">
              <LandingLink href="/inscription" className="w-full lg:w-auto">
                Inscrire mon association
                <IconArrowRight className="size-4" />
              </LandingLink>
              <LandingLink href="/connexion" variant="ghost" className="w-full hover:bg-white/50 lg:w-auto">
                Se connecter
              </LandingLink>
            </div>
          </div>
        </div>
      </LandingContainer>
    </section>
  );
}
