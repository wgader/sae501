import Image from 'next/image';
import LandingContainer from './ui/LandingContainer';

/** Respiration visuelle : la vie associative que l'espace doit servir. */
export default function CommunityBand() {
  return (
    <section aria-labelledby="community-title" className="bg-white py-6 sm:py-10">
      <LandingContainer>
        <figure className="relative isolate overflow-hidden rounded-panel">
          <Image
            src="/landing/vie-associative.jpg"
            alt="Fête de village sur une place de Feytiat : stands d’associations, guirlandes et habitants de tous âges."
            width={2000}
            height={848}
            sizes="(min-width: 1360px) 1264px, 100vw"
            className="aspect-4/5 w-full object-cover sm:aspect-21/9"
          />
          <figcaption className="absolute inset-0 flex items-end bg-linear-to-t from-ink/80 via-ink/25 to-transparent p-7 sm:p-12">
            <p id="community-title" className="max-w-2xl font-display text-3xl leading-tight font-normal tracking-subheading text-white text-balance sm:text-5xl">
              Moins de paperasse, plus de temps pour faire vivre <em>Feytiat</em>.
            </p>
          </figcaption>
        </figure>
      </LandingContainer>
    </section>
  );
}
