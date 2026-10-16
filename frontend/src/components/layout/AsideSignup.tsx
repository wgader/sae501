'use client';

import BackButton from '@/components/ui/BackButton';

export default function AsideSignup() {
  return (
    <aside className="flex h-full min-h-screen w-[clamp(280px,32vw,480px)] shrink-0 flex-col bg-[var(--Mosaic-Tile)] px-[clamp(24px,3vw,60px)] pt-[30px] text-[var(--White)]">
      <BackButton />

      <div className="mt-[80px] flex items-center gap-[10px]">
        <span className="h-[3px] w-[28px] rounded-full bg-[var(--Lime-Cream)]" aria-hidden="true" />
        <p className="text-[13px] font-bold uppercase tracking-[2px] text-[var(--White)]">
          Espace associations
        </p>
      </div>

      <h1 className="mt-[32px] max-w-[360px] text-[clamp(3.4rem,5vw,6.7rem)] font-black leading-[0.93] tracking-[-2.4px] text-[var(--White)]">
        <span className="block">Inscrire mon</span>
        <span className="block text-[var(--Lime-Cream)]">association.</span>
      </h1>

      <p className="mt-[28px] max-w-[360px] text-[17px] leading-[1.55] text-[var(--White)]/95">
        Créez votre espace en quelques minutes pour accéder aux démarches
        municipales de votre association.
      </p>
    </aside>
  );
}