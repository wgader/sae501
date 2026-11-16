import type { Metadata } from 'next';
import { Suspense } from 'react';
import BackButton from '@/components/ui/BackButton';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Nouveau mot de passe | Feytiat',
  description: 'Choisissez un nouveau mot de passe pour votre compte.',
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen w-full flex-row font-sans text-ink">
      <aside className="hidden min-h-screen w-80 shrink-0 flex-col bg-primary px-8 pt-8 text-white lg:flex">
        <BackButton />
        <h2 className="mt-16 max-w-85 text-4xl font-black leading-tight tracking-display text-white">
          <span className="block">Choisir un nouveau</span>
          <span className="block text-accent">mot de passe.</span>
        </h2>
        <p className="mt-5 max-w-85 text-body leading-copy text-white/90">
          Le lien reçu par e-mail est valable une heure et ne fonctionne qu’une fois.
        </p>
      </aside>

      <main className="flex min-w-0 flex-1 items-center justify-center bg-white px-6 py-10 sm:px-12 lg:px-16">
        <section className="w-full max-w-lg">
          <header className="mb-8">
            <h1 className="text-3xl font-black leading-tight tracking-display text-ink">Nouveau mot de passe</h1>
            <p className="mt-2 text-body-sm leading-normal text-muted">
              Toutes les sessions ouvertes avec l’ancien mot de passe seront fermées.
            </p>
          </header>
          <Suspense>
            <ResetPasswordForm />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
