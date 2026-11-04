"use client";

import BackButton from "@/components/ui/BackButton";

export default function AsideSignup() {
  return (
    <aside className="hidden min-h-screen w-[clamp(300px,32vw,440px)] shrink-0 flex-col bg-primary px-[clamp(24px,3vw,56px)] pt-8 text-white lg:flex">
      <BackButton />

      <div className="mt-[clamp(40px,6vh,64px)] flex items-center gap-2.5">
        <span
          className="h-0.75 w-6 rounded-full bg-accent"
          aria-hidden="true"
        />
        <p className="text-label font-bold uppercase tracking-section text-white">
          Espace associations
        </p>
      </div>

      <h1 className="mt-6 max-w-85 text-[clamp(2.125rem,3.2vw,3rem)] font-black leading-[1.05] tracking-display text-white">
        <span className="block">Inscrire mon</span>
        <span className="block text-accent">association.</span>
      </h1>

      <p className="mt-5 max-w-85 text-body leading-copy text-white/90">
        Créez votre espace en quelques minutes pour accéder aux démarches
        municipales de votre association.
      </p>
    </aside>
  );
}
