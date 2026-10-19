'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import FormField from '@/components/ui/FormField';
import BackButton from '@/components/ui/BackButton';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 800);
  }

  return (
    <div className="flex min-h-screen w-full flex-row font-sans text-[var(--ink)]">
      <aside className="hidden min-h-screen w-[clamp(300px,32vw,440px)] shrink-0 flex-col bg-[var(--Mosaic-Tile)] px-[clamp(24px,3vw,56px)] pt-[32px] text-[var(--White)] lg:flex">
        <BackButton />

        <div className="mt-[clamp(40px,6vh,64px)] flex items-center gap-[10px]">
          <span className="h-[3px] w-[24px] rounded-full bg-[var(--Lime-Cream)]" aria-hidden="true" />
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[var(--White)]">
            Espace associations
          </p>
        </div>

        <h2 className="mt-6 max-w-[340px] text-[clamp(2.125rem,3.2vw,3rem)] font-black leading-[1.05] tracking-[-0.03em] text-[var(--White)]">
          <span className="block">Réinitialiser mon</span>
          <span className="block text-[var(--Lime-Cream)]">mot de passe.</span>
        </h2>

        <p className="mt-5 max-w-[340px] text-[0.9375rem] leading-[1.6] text-[var(--White)]/90">
          Recevez un lien sécurisé par email pour définir un nouveau mot de passe
          pour votre compte association.
        </p>
      </aside>

      <main className="flex min-w-0 flex-1 items-center justify-center bg-[var(--White)] px-6 py-10 sm:px-12 lg:px-16">
        <section className="w-full max-w-[480px]">
          <div className="mb-6 lg:hidden">
            <BackButton className="text-[var(--ink)]" />
          </div>

          <header className="mb-8">
            <h1 className="text-[clamp(1.75rem,2.8vw,2.5rem)] font-black leading-[1.08] tracking-[-0.03em] text-[var(--ink)]">
              Mot de passe oublié
            </h1>
            <p className="mt-2 text-[0.875rem] leading-[1.5] text-[var(--muted)]">
              Saisissez l&apos;adresse électronique associée à votre compte association.
            </p>
          </header>

          {isSubmitted ? (
            <div className="rounded-[16px] border border-emerald-200 bg-emerald-50/70 p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-4 text-base font-bold text-emerald-950">
                Email envoyé avec succès
              </h2>
              <p className="mt-2 text-xs leading-5 text-emerald-900/80">
                Si un compte est associé à <strong className="font-semibold">{email}</strong>, vous recevrez un lien de réinitialisation d&apos;ici quelques instants.
              </p>
              <Link
                href="/connexion"
                className="mt-5 inline-flex h-[2.75rem] items-center justify-center rounded-[10px] bg-[var(--Mosaic-Tile)] px-6 text-xs font-bold uppercase tracking-[0.14em] text-[var(--White)] transition-opacity hover:opacity-90"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form className="flex flex-col gap-5" noValidate onSubmit={handleSubmit}>
              <FormField
                label="Votre adresse électronique *"
                type="email"
                name="email"
                placeholder="exemple : contact@association.fr"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <button
                type="submit"
                disabled={isLoading}
                className="flex h-[3rem] w-full items-center justify-center rounded-[10px] bg-[var(--Mosaic-Tile)] px-6 text-xs font-bold uppercase tracking-[0.14em] text-[var(--White)] shadow-xs transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/connexion"
                  className="text-[0.875rem] font-semibold text-[var(--ink)] underline underline-offset-4 transition-colors hover:text-[var(--Mosaic-Tile)]"
                >
                  Retour à la connexion
                </Link>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
