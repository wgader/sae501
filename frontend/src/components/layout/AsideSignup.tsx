"use client";

import BackButton from "@/components/ui/BackButton";

export default function AsideSignup() {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 flex-col bg-primary px-6 pt-8 text-white lg:flex">
      <BackButton />

      <div className="mt-16 flex items-center gap-2.5">
        <span
          className="h-0.75 w-6 rounded-full bg-accent"
          aria-hidden="true"
        />
        <p className="text-label font-bold uppercase tracking-section text-white">
          Espace associations
        </p>
      </div>

      <h1 className="mt-6 max-w-85 text-5xl font-black leading-tight tracking-display text-white">
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
