'use client';

import { type FormEvent, Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

const CRITERIA = [
  { id: 'length', label: '8 caractères minimum', test: (p: string) => p.length >= 8 },
  { id: 'upper', label: 'Une majuscule (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'Une minuscule (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'Un chiffre (0-9)', test: (p: string) => /[0-9]/.test(p) },
  { id: 'special', label: 'Un caractère spécial', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

type StrengthLevel = {
  label: string;
  colorClass: string;
  segments: number;
};

function getStrength(password: string): StrengthLevel | null {
  if (!password) return null;
  const met = CRITERIA.filter((c) => c.test(password)).length;
  if (met <= 2) return { label: 'Faible', colorClass: 'bg-[var(--Flush-Mahogany)] text-[var(--Flush-Mahogany)]', segments: 1 };
  if (met === 3) return { label: 'Moyen', colorClass: 'bg-amber-500 text-amber-600', segments: 2 };
  if (met === 4) return { label: 'Fort', colorClass: 'bg-emerald-500 text-emerald-600', segments: 3 };
  return { label: 'Très fort', colorClass: 'bg-emerald-600 text-emerald-700', segments: 4 };
}

function ActivationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token') ?? '';
  const ref = searchParams.get('ref') ?? '';

  let email = '';
  try {
    email = ref ? atob(ref) : '';
  } catch {
    email = '';
  }

  const isParamsValid = token !== '' && email !== '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    document.title = 'Activation de compte · Espace associations | Feytiat';
  }, []);

  const strength = getStrength(password);
  const metCriteria = CRITERIA.map((c) => c.test(password));
  const allMet = metCriteria.every(Boolean);
  const confirmMatch = confirmPassword !== '' && password === confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!allMet) {
      setError('Votre mot de passe ne respecte pas tous les critères de sécurité requis.');
      return;
    }
    if (!confirmMatch) {
      setError('Les deux mots de passe saisis ne correspondent pas.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        token?: string;
        message?: string;
        user?: { nomAssociation?: string };
      };

      if (!response.ok) {
        throw new Error(data.message ?? 'Une erreur est survenue lors de l’activation.');
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.user?.nomAssociation) {
          localStorage.setItem('association_name', data.user.nomAssociation);
        }
        window.dispatchEvent(new Event('auth-change'));
      }

      setActivated(true);
      setTimeout(() => {
        router.push('/');
      }, 2500);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors de l’activation du compte.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full flex-col font-sans text-[var(--ink)] lg:flex-row">
      {/* ── Volet latéral gauche ───────────────────────────── */}
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
            <span>Retour à l&apos;accueil</span>
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
            Espace associations
          </span>

          <h2 className="text-[clamp(1.875rem,2.8vw,2.5rem)] font-black leading-[1.1] tracking-[-0.03em] text-[var(--White)]">
            <span className="block">Activez votre</span>
            <span className="block text-[var(--Lime-Cream)]">compte.</span>
          </h2>

          <p className="text-[0.9375rem] leading-[1.6] text-white/90">
            La demande d&apos;inscription de votre association a été validée par la mairie. Définissez votre mot de passe pour accéder à vos démarches.
          </p>

          <ul className="space-y-3 pt-2 text-xs font-semibold text-white/95">
            <li className="flex items-center gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--Lime-Cream)] text-[0.625rem] font-black text-[var(--Mosaic-Tile)]">
                ✓
              </span>
              <span>Tableau de bord de votre association</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--Lime-Cream)] text-[0.625rem] font-black text-[var(--Mosaic-Tile)]">
                ✓
              </span>
              <span>Réservations de salles & prêt de matériel</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--Lime-Cream)] text-[0.625rem] font-black text-[var(--Mosaic-Tile)]">
                ✓
              </span>
              <span>Dépôt des dossiers de subventions annuelles</span>
            </li>
          </ul>
        </header>

        <footer className="border-t border-white/15 pt-6 text-[0.75rem] text-white/70">
          Mairie de Feytiat · Service Vie associative
        </footer>
      </aside>

      {/* ── Contenu principal ──────────────────────────────── */}
      <section className="flex flex-1 items-center justify-center bg-[var(--White)] px-6 py-12 sm:px-12 lg:px-16">
        <article className="w-full max-w-[30rem]">
          <nav aria-label="Retour" className="mb-8 lg:hidden">
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
              <span>Retour à l&apos;accueil</span>
            </Link>
          </nav>

          {/* ── Cas 1 : Lien invalide ou manquant ─────────── */}
          {!isParamsValid && (
            <section aria-labelledby="invalid-link-title">
              <header className="mb-6">
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-[var(--Flush-Mahogany)]">
                  Lien introuvable
                </p>
                <h1
                  id="invalid-link-title"
                  className="mt-2 text-[clamp(1.75rem,2.5vw,2.25rem)] font-black tracking-tight text-[var(--ink)]"
                >
                  Lien d&apos;activation invalide
                </h1>
                <p className="mt-2 text-[0.875rem] leading-[1.6] text-[var(--muted)]">
                  Ce lien d&apos;activation est invalide, incomplet ou a expiré. Veuillez vérifier le lien reçu dans l&apos;e-mail de confirmation transmis par la mairie de Feytiat.
                </p>
              </header>

              <p className="rounded-[10px] border-l-4 border-[var(--Flush-Mahogany)] bg-rose-50/70 p-4 text-xs font-semibold leading-5 text-[var(--Flush-Mahogany)]">
                Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, rapprochez-vous du service Vie associative pour obtenir un nouveau lien d&apos;activation.
              </p>

              <footer className="mt-8 flex flex-col gap-3">
                <Link
                  href="/connexion"
                  className="flex h-[3.125rem] w-full items-center justify-center rounded-[10px] bg-[var(--Mosaic-Tile)] px-6 text-xs font-bold uppercase tracking-[0.14em] text-[var(--White)] shadow-xs transition-opacity hover:opacity-90"
                >
                  Aller à la page de connexion
                </Link>
                <Link
                  href="/"
                  className="flex h-[3.125rem] w-full items-center justify-center rounded-[10px] border border-[var(--line)] bg-[var(--White)] px-6 text-xs font-bold uppercase tracking-[0.14em] text-[var(--ink)] hover:bg-[var(--paper)] transition"
                >
                  Retour à l&apos;accueil
                </Link>
              </footer>
            </section>
          )}

          {/* ── Cas 2 : Compte activé avec succès ─────────── */}
          {isParamsValid && activated && (
            <section aria-labelledby="success-title" className="text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--Lime-Cream)] text-[var(--Mosaic-Tile)]">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>

              <header className="mt-6 mb-8">
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-[var(--Mosaic-Tile)]">
                  Félicitations
                </p>
                <h1
                  id="success-title"
                  className="mt-2 text-[clamp(1.75rem,2.5vw,2.25rem)] font-black tracking-tight text-[var(--ink)]"
                >
                  Compte activé avec succès !
                </h1>
                <p className="mt-2 text-[0.875rem] leading-[1.6] text-[var(--muted)]">
                  Votre mot de passe a bien été enregistré. Vous allez être automatiquement redirigé vers votre espace association.
                </p>
              </header>

              <footer className="pt-2">
                <Link
                  href="/"
                  className="flex h-[3.125rem] w-full items-center justify-center rounded-[10px] bg-[var(--Mosaic-Tile)] px-6 text-xs font-bold uppercase tracking-[0.14em] text-[var(--White)] shadow-xs transition-opacity hover:opacity-90"
                >
                  Accéder directement à mon espace
                </Link>
              </footer>
            </section>
          )}

          {/* ── Cas 3 : Formulaire d'activation ───────────── */}
          {isParamsValid && !activated && (
            <section aria-labelledby="form-heading">
              <header className="mb-8">
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-[var(--Mosaic-Tile)]">
                  Activation de compte
                </p>
                <h1
                  id="form-heading"
                  className="mt-2 text-[clamp(1.75rem,2.5vw,2.25rem)] font-black tracking-tight text-[var(--ink)]"
                >
                  Définissez votre mot de passe
                </h1>
                <p className="mt-2 text-[0.875rem] leading-[1.6] text-[var(--muted)]">
                  Choisissez un mot de passe sécurisé pour finaliser l&apos;accès à votre espace association.
                </p>

                <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-3.5 py-1.5 text-xs text-[var(--ink)]">
                  <span className="font-semibold text-[var(--muted)]">Compte :</span>
                  <span className="font-bold">{email}</span>
                </p>
              </header>

              <form className="space-y-6" noValidate onSubmit={handleSubmit}>
                {/* ── Champ Mot de passe ── */}
                <label className="block">
                  <span className="mb-2 block text-[0.75rem] font-bold uppercase tracking-[0.14em] text-[var(--ink)]">
                    Nouveau mot de passe
                  </span>
                  <span className="relative block">
                    <input
                      id="activation-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={password}
                      required
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
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

                {/* ── Indicateur de force ── */}
                {strength && (
                  <p className="flex items-center gap-3">
                    <span className="flex flex-1 gap-1" aria-hidden="true">
                      {[1, 2, 3, 4].map((seg) => (
                        <span
                          key={seg}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            seg <= strength.segments ? strength.colorClass.split(' ')[0] : 'bg-[var(--line)]'
                          }`}
                        />
                      ))}
                    </span>
                    <span className={`text-[0.6875rem] font-bold uppercase tracking-[0.1em] ${strength.colorClass.split(' ')[1]}`}>
                      {strength.label}
                    </span>
                  </p>
                )}

                {/* ── Liste des critères ── */}
                <ul className="grid grid-cols-1 gap-2 rounded-[14px] border border-[var(--line)] bg-[var(--paper)] p-4 sm:grid-cols-2">
                  {CRITERIA.map((criterion, i) => {
                    const isMet = metCriteria[i];
                    return (
                      <li key={criterion.id} className="flex items-center gap-2 text-xs">
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[0.625rem] font-bold transition ${
                            isMet
                              ? 'bg-emerald-600 text-white'
                              : 'border border-[var(--line)] bg-[var(--White)] text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                        <span className={isMet ? 'font-semibold text-emerald-800' : 'text-[var(--muted)]'}>
                          {criterion.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* ── Champ Confirmation ── */}
                <label className="block">
                  <span className="mb-2 block text-[0.75rem] font-bold uppercase tracking-[0.14em] text-[var(--ink)]">
                    Confirmez le mot de passe
                  </span>
                  <span className="relative block">
                    <input
                      id="activation-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      required
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      className={`h-[3.25rem] w-full rounded-[10px] border bg-[var(--paper)] px-4 pr-12 text-[0.875rem] text-[var(--ink)] placeholder-[var(--muted)]/50 outline-none transition focus:bg-[var(--White)] focus:ring-2 ${
                        confirmPassword
                          ? confirmMatch
                            ? 'border-emerald-500 focus:border-emerald-600 focus:ring-emerald-500/15'
                            : 'border-[var(--Flush-Mahogany)] focus:border-[var(--Flush-Mahogany)] focus:ring-[var(--Flush-Mahogany)]/15'
                          : 'border-[var(--line)] focus:border-[var(--Mosaic-Tile)] focus:ring-[var(--Mosaic-Tile)]/15'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
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
                        {showConfirm && <path d="M3 3L21 21" strokeLinecap="round" />}
                      </svg>
                    </button>
                  </span>
                </label>

                {confirmPassword && !confirmMatch && (
                  <p className="text-xs font-semibold text-[var(--Flush-Mahogany)]" role="alert">
                    Les mots de passe ne correspondent pas.
                  </p>
                )}

                {error && (
                  <p
                    className="rounded-[10px] border-l-4 border-[var(--Flush-Mahogany)] bg-rose-50/70 p-3.5 text-xs font-semibold leading-5 text-[var(--Flush-Mahogany)]"
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !allMet || !confirmMatch}
                  className="flex h-[3.125rem] w-full items-center justify-center gap-2.5 rounded-[10px] bg-[var(--Mosaic-Tile)] px-6 text-xs font-bold uppercase tracking-[0.14em] text-[var(--White)] shadow-xs transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Activation en cours...</span>
                    </>
                  ) : (
                    <span>Activer mon compte</span>
                  )}
                </button>
              </form>

              <footer className="mt-8 border-t border-[var(--line)] pt-6 text-center text-xs text-[var(--muted)]">
                <p>Plateforme municipale de la Ville de Feytiat.</p>
                <p className="mt-1">
                  Besoin d&apos;aide ? Contactez le{' '}
                  <span className="font-semibold text-[var(--ink)]">service Vie associative</span>.
                </p>
              </footer>
            </section>
          )}
        </article>
      </section>
    </main>
  );
}

export default function ActivationPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          Chargement de l&apos;activation...
        </main>
      }
    >
      <ActivationContent />
    </Suspense>
  );
}