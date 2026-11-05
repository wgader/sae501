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
    <div className="flex min-h-screen w-full flex-row font-sans text-ink">
      <aside className="hidden min-h-screen w-[clamp(18.75rem,32vw,27.5rem)] shrink-0 flex-col bg-primary px-[clamp(1.5rem,3vw,3.5rem)] pt-8 text-white lg:flex">
        <BackButton />

        <div className="mt-[clamp(2.5rem,6vh,4rem)] flex items-center gap-2.5">
          <span className="h-0.5 w-6 rounded-full bg-accent" aria-hidden="true" />
          <p className="text-label font-bold uppercase tracking-section text-white">
            Espace associations
          </p>
        </div>

        <h2 className="mt-6 max-w-85 text-[clamp(2.125rem,3.2vw,3rem)] font-black leading-[1.05] tracking-display text-white">
          <span className="block">Réinitialiser mon</span>
          <span className="block text-accent">mot de passe.</span>
        </h2>

        <p className="mt-5 max-w-85 text-body leading-copy text-white/90">
          Recevez un lien sécurisé par email pour définir un nouveau mot de passe
          pour votre compte association.
        </p>
      </aside>

      <main className="flex min-w-0 flex-1 items-center justify-center bg-white px-6 py-10 sm:px-12 lg:px-16">
        <section className="w-full max-w-lg">
          <div className="mb-6 lg:hidden">
            <BackButton className="text-ink" />
          </div>

          <header className="mb-8">
            <h1 className="text-[clamp(1.75rem,2.8vw,2.5rem)] font-black leading-[1.08] tracking-display text-ink">
              Mot de passe oublié
            </h1>
            <p className="mt-2 text-body-sm leading-normal text-muted">
              Saisissez l&apos;adresse électronique associée à votre compte association.
            </p>
          </header>

          {isSubmitted ? (
            <div className="rounded-card border border-emerald-200 bg-emerald-50/70 p-6 text-center">
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
                className="mt-5 inline-flex h-control-compact items-center justify-center rounded-control bg-primary px-6 text-xs font-bold uppercase tracking-label text-white transition-colors hover:bg-primary-hover"
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
                className="flex h-12 w-full items-center justify-center rounded-control bg-primary px-6 text-xs font-bold uppercase tracking-label text-white shadow-xs transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/connexion"
                  className="text-body-sm font-semibold text-ink underline underline-offset-4 transition-colors hover:text-primary"
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
