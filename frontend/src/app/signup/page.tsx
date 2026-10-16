'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import FormField from '@/components/ui/FormField';

export default function SignupPage() {
  const router = useRouter();
  const [isAccepted, setIsAccepted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAccepted) return;
    router.push('/login');
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-white px-6 pt-10 sm:px-10 lg:px-16 lg:pt-12">
      <div className="w-full max-w-[860px] pb-0">
        <h1 className="text-[clamp(2.8rem,4vw,6rem)] font-black leading-[0.95] tracking-[-0.08em] text-[var(--ink)]">
          Parlez-nous de votre
          <span className="block">association</span>
        </h1>

        <p className="mt-6 text-[15px] text-[var(--ink)]/70">
          Tout les champs suivis d&apos;un astérisque (*) sont obligatoires.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 max-w-[620px]">
          <div className="space-y-6">
            <FormField
              label="Nom de l'association"
              name="associationName"
              type="text"
              placeholder="exemple : Feytiat Loisirs"
              required
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                label="Nom du président"
                name="presidentLastName"
                type="text"
                placeholder="exemple : Dupont"
                required
              />

              <FormField
                label="Prénom du président"
                name="presidentFirstName"
                type="text"
                placeholder="exemple : Camille"
                required
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                label="E-mail"
                name="email"
                type="email"
                placeholder="exemple : monadresse@domaine.fr"
                required
              />

              <FormField
                label="Numéro de téléphone"
                name="phone"
                type="tel"
                placeholder="exemple : 05 XX XX XX XX"
                maxLength={10}
                required
              />
            </div>

            <label className="flex items-center gap-3 text-[15px] text-black/80">
              <input
                type="checkbox"
                checked={isAccepted}
                onChange={(e) => setIsAccepted(e.target.checked)}
                className="h-5 w-5 rounded border border-[var(--ink)]/30 accent-[var(--Mosaic-Tile)]"
              />
              <span>
                J&apos;accepte les conditions générales d&apos;utilisation (CGU).
              </span>
            </label>

            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                type="submit"
                disabled={!isAccepted}
                className="inline-flex items-center justify-center gap-3 rounded-[10px] bg-[var(--Mosaic-Tile)] px-6 py-4 text-[14px] font-bold uppercase tracking-[0.18em] text-[var(--White)] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                Envoyer la demande
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--White)]/20 text-lg">→</span>
              </button>

              <p className="max-w-[220px] text-right text-[12px] leading-relaxed text-[var(--ink)]/60">
                Votre demande sera revue par le service des associations.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}