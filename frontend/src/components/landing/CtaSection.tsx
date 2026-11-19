import { IconArrowRight } from '@/components/ui/icons';
import VillageSkyline from './illustrations/VillageSkyline';
import BrandDot from './ui/BrandDot';
import LandingContainer from './ui/LandingContainer';
import LandingLink from './ui/LandingLink';
import Reveal from './ui/Reveal';

/** Dernier appel à l'action, posé sur la silhouette du bourg. */
export default function CtaSection() {
  return (
    <section aria-labelledby="cta-title" className="bg-white pb-24 sm:pb-32">
      <LandingContainer>
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-panel bg-primary px-7 pt-16 pb-40 text-center sm:pt-24 sm:pb-56">
            <h2 id="cta-title" className="mx-auto max-w-2xl text-4xl font-black tracking-heading text-balance text-white sm:text-6xl">
              Moins de papiers, plus d’asso<BrandDot />
            </h2>
            <p className="mx-auto mt-5 max-w-md text-body-lg leading-copy text-white/75">L’inscription prend deux minutes.</p>
            <LandingLink href="/inscription" variant="secondary" className="mt-9 rounded-pill border-white">
              Créer le compte de mon asso
              <IconArrowRight className="size-4" />
            </LandingLink>
            <VillageSkyline className="absolute inset-x-0 bottom-0 -z-10 h-36 w-full sm:h-52" />
          </div>
        </Reveal>
      </LandingContainer>
    </section>
  );
}
