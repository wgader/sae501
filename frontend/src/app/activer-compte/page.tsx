'use client';

import { type FormEvent, Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ActivationForm, { type StrengthLevel } from '@/components/activation/ActivationForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
const CRITERIA = [
  { id: 'length', label: '8 caractères minimum', test: (password: string) => password.length >= 8 },
  { id: 'upper', label: 'Une majuscule (A-Z)', test: (password: string) => /[A-Z]/.test(password) },
  { id: 'lower', label: 'Une minuscule (a-z)', test: (password: string) => /[a-z]/.test(password) },
  { id: 'number', label: 'Un chiffre (0-9)', test: (password: string) => /[0-9]/.test(password) },
  { id: 'special', label: 'Un caractère spécial', test: (password: string) => /[^A-Za-z0-9]/.test(password) },
] as const;

function getStrength(password: string): StrengthLevel | null {
  if (!password) return null;
  const met = CRITERIA.filter((criterion) => criterion.test(password)).length;
  if (met <= 2) return { label: 'Faible', colorClass: 'bg-danger text-danger', segments: 1 };
  if (met === 3) return { label: 'Moyen', colorClass: 'bg-amber-500 text-amber-600', segments: 2 };
  if (met === 4) return { label: 'Fort', colorClass: 'bg-emerald-500 text-emerald-600', segments: 3 };
  return { label: 'Très fort', colorClass: 'bg-emerald-600 text-emerald-700', segments: 4 };
}

function ActivationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fragmentParams] = useState<URLSearchParams | null>(() => (
    typeof window === 'undefined'
      ? null
      : new URLSearchParams(window.location.hash.slice(1))
  ));
  const token = fragmentParams?.get('token') ?? searchParams.get('token') ?? '';
  const ref = fragmentParams?.get('ref') ?? searchParams.get('ref') ?? '';
  let email = '';
  try { email = ref ? atob(ref) : ''; } catch { email = ''; }
  const isParamsValid = Boolean(token && email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activated, setActivated] = useState(false);
  const metCriteria = CRITERIA.map((criterion) => criterion.test(password));
  const allMet = metCriteria.every(Boolean);
  const confirmMatch = confirmPassword !== '' && password === confirmPassword;

  useEffect(() => { document.title = 'Activation de compte · Espace associations | Feytiat'; }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!allMet) { setError('Votre mot de passe ne respecte pas tous les critères de sécurité requis.'); return; }
    if (!confirmMatch) { setError('Les deux mots de passe saisis ne correspondent pas.'); return; }
    setError(''); setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/activate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, email, password }) });
      const data = await response.json().catch(() => ({})) as { token?: string; message?: string; user?: { nomAssociation?: string } };
      if (!response.ok) throw new Error(data.message ?? 'Une erreur est survenue lors de l’activation.');
      if (data.token) { localStorage.setItem('token', data.token); if (data.user?.nomAssociation) localStorage.setItem('association_name', data.user.nomAssociation); window.dispatchEvent(new Event('auth-change')); }
      setActivated(true);
      window.setTimeout(() => router.push('/'), 2500);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Une erreur est survenue lors de l’activation du compte.'); }
    finally { setIsLoading(false); }
  }

  return (
    <main className="flex min-h-screen w-full flex-col font-sans text-ink lg:flex-row">
      <aside className="hidden min-h-screen w-80 shrink-0 flex-col justify-between bg-primary p-8 text-white lg:flex lg:p-10">
        <header className="space-y-8"><Link href="/" className="text-xs font-bold uppercase tracking-label">← Retour à l&apos;accueil</Link><Image src="/assets/logo-feytiat-white.svg" alt="Ville de Feytiat" width={160} height={34} priority className="h-9 w-auto" /><span className="inline-block rounded-full bg-accent px-3.5 py-1 text-label font-bold uppercase text-ink">Espace associations</span><h2 className="text-3xl font-black text-white">Activez votre <span className="text-accent">compte.</span></h2><p className="text-body text-white/90">La demande d&apos;inscription de votre association a été validée par la mairie. Définissez votre mot de passe pour accéder à vos démarches.</p></header>
        <footer className="border-t border-white/15 pt-6 text-meta text-white/70">Mairie de Feytiat · Service Vie associative</footer>
      </aside>
      <section className="flex flex-1 items-center justify-center bg-white px-6 py-12 sm:px-12 lg:px-16"><article className="w-full max-w-lg">
        <nav aria-label="Retour" className="mb-8 lg:hidden"><Link href="/" className="text-xs font-bold uppercase tracking-label text-primary">← Retour à l&apos;accueil</Link></nav>
        {!isParamsValid && <section aria-labelledby="invalid-link-title"><p className="text-label font-bold uppercase tracking-kicker text-danger">Lien introuvable</p><h1 id="invalid-link-title" className="mt-2 text-3xl font-black">Lien d&apos;activation invalide</h1><p className="mt-2 text-body-sm text-muted">Ce lien d&apos;activation est invalide, incomplet ou a expiré.</p><div className="mt-8 flex flex-col gap-3"><Link href="/connexion" className="flex h-control items-center justify-center rounded-lg bg-primary px-6 text-xs font-bold uppercase text-white">Aller à la page de connexion</Link><Link href="/" className="flex h-control items-center justify-center rounded-lg border border-line px-6 text-xs font-bold uppercase">Retour à l&apos;accueil</Link></div></section>}
        {isParamsValid && activated && <section className="text-center"><p className="text-label font-bold uppercase tracking-kicker text-primary">Félicitations</p><h1 className="mt-2 text-3xl font-black">Compte activé avec succès !</h1><p className="mt-2 text-body-sm text-muted">Votre mot de passe a bien été enregistré. Vous allez être automatiquement redirigé.</p><Link href="/" className="mt-8 flex h-control items-center justify-center rounded-lg bg-primary px-6 text-xs font-bold uppercase text-white">Accéder directement à mon espace</Link></section>}
        {isParamsValid && !activated && <ActivationForm email={email} password={password} confirmPassword={confirmPassword} showPassword={showPassword} showConfirm={showConfirm} strength={getStrength(password)} metCriteria={metCriteria} allMet={allMet} confirmMatch={confirmMatch} error={error} isLoading={isLoading} criteria={CRITERIA} onPasswordChange={(value) => { setPassword(value); setError(''); }} onConfirmChange={(value) => { setConfirmPassword(value); setError(''); }} onTogglePassword={() => setShowPassword((value) => !value)} onToggleConfirm={() => setShowConfirm((value) => !value)} onSubmit={handleSubmit} />}
      </article></section>
    </main>
  );
}

export default function ActivationPage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-paper text-xs font-bold uppercase text-muted">Chargement de l&apos;activation...</main>}><ActivationContent /></Suspense>;
}
