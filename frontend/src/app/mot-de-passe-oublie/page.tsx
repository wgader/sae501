'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import FormField from '@/components/ui/FormField';
import BackButton from '@/components/ui/BackButton';
import Notice from '@/components/ui/Notice';
import { requestPasswordReset } from '@/lib/api/auth';
import { logger } from '@/lib/logger';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setError('Indiquez votre adresse électronique.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await requestPasswordReset(email.trim());
      setIsSubmitted(true);
    } catch (err) {
      logger.error('Demande de réinitialisation impossible', err);
      setError(err instanceof Error ? err.message : 'La demande n’a pas pu être envoyée.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-row font-sans text-ink">
      <aside className="hidden min-h-screen w-80 shrink-0 flex-col bg-primary px-8 pt-8 text-white lg:flex">
        <BackButton />

        <div className="mt-16 flex items-center gap-2.5">
          <span className="h-0.5 w-6 rounded-full bg-accent" aria-hidden="true" />
          <p className="text-label font-bold uppercase tracking-section text-white">
            Espace associations
          </p>
        </div>

        <h2 className="mt-6 max-w-85 text-4xl font-black leading-tight tracking-display text-white">
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
            <h1 className="text-3xl font-black leading-tight tracking-display text-ink">
              Mot de passe oublié
            </h1>
            <p className="mt-2 text-body-sm leading-normal text-muted">
              Saisissez l&apos;adresse électronique de votre compte, association ou mairie.
            </p>
          </header>

          {isSubmitted ? (
            <div className="space-y-5">
              <Notice tone="success" title="Vérifiez votre messagerie">
                Si un compte actif est associé à <strong className="font-semibold">{email}</strong>, un lien de
                réinitialisation vient de lui être envoyé. Il est valable une heure.
              </Notice>
              <Link
                href="/connexion"
                className="inline-flex h-control-compact items-center justify-center rounded-control bg-primary px-6 text-xs font-bold uppercase tracking-label text-white transition-colors hover:bg-primary-hover"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form method="post" className="flex flex-col gap-5" noValidate onSubmit={handleSubmit}>
              <FormField
                label="Votre adresse électronique"
                type="email"
                name="email"
                placeholder="exemple : contact@association.fr"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {error && <Notice tone="danger">{error}</Notice>}

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
