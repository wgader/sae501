'use client';

import BackButton from '@/components/ui/BackButton';

export default function AsideSignup() {
  return (
    <aside className="hidden min-h-screen w-[clamp(18.75rem,32vw,27.5rem)] shrink-0 flex-col bg-[var(--Mosaic-Tile)] px-[clamp(1.5rem,3vw,3.5rem)] pt-8 text-[var(--White)] lg:flex">
      <BackButton />

      <div className="mt-[clamp(2.5rem,6vh,4rem)] flex items-center gap-[0.63rem]">
        <span className="h-[0.19rem] w-[1.5rem] rounded-full bg-[var(--Lime-Cream)]" aria-hidden="true" />
        <p className="text-[0.69rem] font-bold uppercase tracking-[0.18em] text-[var(--White)]">
          Espace associations
        </p>
      </div>

      <h1 className="mt-6 max-w-[21.25rem] text-[clamp(2.13rem,3.2vw,3rem)] font-black leading-[1.05] tracking-[-0.03em] text-[var(--White)]">
        <span className="block">Inscrire mon</span>
        <span className="block text-[var(--Lime-Cream)]">association.</span>
      </h1>

      <p className="mt-5 max-w-[21.25rem] text-[0.94rem] leading-[1.6] text-[var(--White)]/90">
        Créez votre espace en quelques minutes pour accéder aux démarches
        municipales de votre association.
      </p>
    </aside>
  );
}