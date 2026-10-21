'use client';

import { type FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    document.title = 'Administration · Connexion | Ville de Feytiat';
    const token = localStorage.getItem('admin_token');
    if (token) {
      router.replace('/admin/dashboard');
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const identifier = formData.get('identifier') as string;

    if (!identifier || !password) {
      setSubmitError('Veuillez renseigner votre identifiant et votre mot de passe.');
      return;
    }

    setSubmitError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        token?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message ?? 'Identifiants incorrects.');
      }

      if (!data.token) {
        throw new Error('Réponse invalide du serveur.');
      }

      localStorage.setItem('admin_token', data.token);
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : 'Une erreur est survenue lors de la connexion.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full flex-col font-sans text-[var(--ink)] lg:flex-row">
      <aside className="hidden min-h-screen w-[clamp(20rem,32vw,27.5rem)] shrink-0 flex-col justify-between bg-[var(--Mosaic-Tile)] p-8 lg:flex lg:p-12 text-[var(--White)]">
        <header className="space-y-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--White)] transition-opacity hover:opacity-80"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Retour au site public</span>
          </Link>

          <figure className="m-0">
            <Image
              src="/assets/logo-feytiat-white.svg"
              alt="Ville de Feytiat"
              width={160}
              height={34}
              priority
              className="h-9 w-auto object-contain"
            />
          </figure>

          <span className="inline-block rounded-full bg-[var(--Lime-Cream)] px-3.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[var(--ink)]">
            Portail municipal
          </span>

          <h2 className="text-[clamp(1.875rem,2.8vw,2.5rem)] font-black leading-[1.1] tracking-[-0.03em] text-[var(--White)]">
            <span className="block">Espace</span>
            <span className="block text-[var(--Lime-Cream)]">Administration.</span>
          </h2>

          <p className="text-[0.9375rem] leading-[1.6] text-white/90">
            Accès sécurisé réservé aux agents municipaux et administrateurs habilités de la mairie de Feytiat.
          </p>

          <ul className="space-y-3 pt-2 text-xs font-semibold text-white/95">
            <li className="flex items-center gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--Lime-Cream)] text-[var(--Mosaic-Tile)]">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>
              <span>Validation des demandes d&apos;inscription</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--Lime-Cream)] text-[var(--Mosaic-Tile)]">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>
              <span>Attribution des modules associatifs</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--Lime-Cream)] text-[var(--Mosaic-Tile)]">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>
              <span>Supervision des démarches de Feytiat</span>
            </li>
          </ul>
        </header>

        <footer className="border-t border-white/15 pt-6 text-[0.75rem] text-white/70">
          Mairie de Feytiat · Tous droits réservés
        </footer>
      </aside>

      <section className="flex flex-1 items-center justify-center bg-[var(--White)] px-6 py-12 sm:px-12 lg:px-16">
        <article className="w-full max-w-[28rem]">
          <nav aria-label="Retour au site" className="mb-8 lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--Mosaic-Tile)] transition-opacity hover:opacity-80"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span>Retour au site public</span>
            </Link>
          </nav>

          <header className="mb-8">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-[var(--Mosaic-Tile)]">
              Espace administration
            </p>
            <h1 className="mt-2 text-[clamp(1.75rem,2.5vw,2.25rem)] font-black tracking-tight text-[var(--ink)]">
              Connexion
            </h1>
            <p className="mt-2 text-[0.875rem] leading-[1.6] text-[var(--muted)]">
              Renseignez vos identifiants d&apos;agent municipal pour accéder à votre panneau d&apos;administration.
            </p>
          </header>

          <form className="space-y-5" noValidate onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-[0.75rem] font-bold uppercase tracking-[0.14em] text-[var(--ink)]">
                Adresse électronique
              </span>
              <input
                id="admin-identifier"
                type="email"
                name="identifier"
                autoComplete="username"
                placeholder="exemple : mail@mairie.fr"
                required
                onChange={() => setSubmitError('')}
                className="h-[3.25rem] w-full rounded-[10px] border border-[var(--line)] bg-[var(--paper)] px-4 text-[0.875rem] text-[var(--ink)] placeholder-[var(--muted)]/50 outline-none transition focus:border-[var(--Mosaic-Tile)] focus:bg-[var(--White)] focus:ring-2 focus:ring-[var(--Mosaic-Tile)]/15"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[0.75rem] font-bold uppercase tracking-[0.14em] text-[var(--ink)]">
                Mot de passe
              </span>
              <span className="relative block">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  required
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setSubmitError('');
                  }}
                  className="h-[3.25rem] w-full rounded-[10px] border border-[var(--line)] bg-[var(--paper)] px-4 pr-12 text-[0.875rem] text-[var(--ink)] placeholder-[var(--muted)]/50 outline-none transition focus:border-[var(--Mosaic-Tile)] focus:bg-[var(--White)] focus:ring-2 focus:ring-[var(--Mosaic-Tile)]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] transition hover:text-[var(--ink)] cursor-pointer"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3.5" />
                    {showPassword && <path d="M3 3L21 21" strokeLinecap="round" />}
                  </svg>
                </button>
              </span>
            </label>

            {submitError && (
              <p
                className="rounded-[10px] border-l-4 border-[var(--Flush-Mahogany)] bg-rose-50/70 p-3.5 text-xs font-semibold leading-5 text-[var(--Flush-Mahogany)]"
                role="alert"
              >
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-[3.125rem] w-full items-center justify-center gap-2.5 rounded-[10px] bg-[var(--Mosaic-Tile)] px-6 text-xs font-bold uppercase tracking-[0.14em] text-[var(--White)] shadow-xs transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <span>Se connecter</span>
              )}
            </button>
          </form>

          <footer className="mt-8 border-t border-[var(--line)] pt-6 text-center text-xs text-[var(--muted)]">
            <p>Accès strictement réservé aux agents de la mairie de Feytiat.</p>
            <p className="mt-1">
              Vous êtes une association ?{' '}
              <Link
                href="/connexion"
                className="font-bold text-[var(--Mosaic-Tile)] underline underline-offset-2 hover:opacity-85"
              >
                Espace associations
              </Link>
            </p>
          </footer>
        </article>
      </section>
    </main>
  );
}