'use client';

import BackButton from '@/components/ui/BackButton';

export default function AsideSignup() {
  return (
    <aside className="hidden min-h-screen w-[clamp(300px,32vw,440px)] shrink-0 flex-col bg-[var(--Mosaic-Tile)] px-[clamp(24px,3vw,56px)] pt-[32px] text-[var(--White)] lg:flex">
      <BackButton />

      <div className="mt-[clamp(40px,6vh,64px)] flex items-center gap-[10px]">
        <span className="h-[3px] w-[24px] rounded-full bg-[var(--Lime-Cream)]" aria-hidden="true" />
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[var(--White)]">
          Espace associations
        </p>
      </div>

      <h1 className="mt-6 max-w-[340px] text-[clamp(2.125rem,3.2vw,3rem)] font-black leading-[1.05] tracking-[-0.03em] text-[var(--White)]">
        <span className="block">Inscrire mon</span>
        <span className="block text-[var(--Lime-Cream)]">association.</span>
      </h1>

      <p className="mt-5 max-w-[340px] text-[0.9375rem] leading-[1.6] text-[var(--White)]/90">
        Créez votre espace en quelques minutes pour accéder aux démarches
        municipales de votre association.
      </p>
    </aside>
  );
}