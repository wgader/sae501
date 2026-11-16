'use client';

import { type FormEvent } from 'react';

export type StrengthLevel = { label: string; colorClass: string; segments: number };

interface ActivationFormProps {
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirm: boolean;
  strength: StrengthLevel | null;
  metCriteria: boolean[];
  allMet: boolean;
  confirmMatch: boolean;
  error: string;
  isLoading: boolean;
  criteria: ReadonlyArray<{ id: string; label: string }>;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  onTogglePassword: () => void;
  onToggleConfirm: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function ActivationForm({
  email, password, confirmPassword, showPassword, showConfirm, strength, metCriteria,
  allMet, confirmMatch, error, isLoading, criteria, onPasswordChange, onConfirmChange,
  onTogglePassword, onToggleConfirm, onSubmit,
}: ActivationFormProps) {
  return (
    <section aria-labelledby="form-heading">
      <header className="mb-8">
        <p className="text-label font-bold uppercase tracking-kicker text-primary">Activation de compte</p>
        <h1 id="form-heading" className="mt-2 text-3xl font-black tracking-tight text-ink">Définissez votre mot de passe</h1>
        <p className="mt-2 text-body-sm leading-copy text-muted">Choisissez un mot de passe sécurisé pour finaliser l&apos;accès à votre espace association.</p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-1.5 text-xs text-ink"><span className="font-semibold text-muted">Compte :</span><span className="font-bold">{email}</span></p>
      </header>
      <form className="space-y-6" noValidate onSubmit={onSubmit}>
        <label className="block"><span className="mb-2 block text-meta font-bold uppercase tracking-label text-ink">Nouveau mot de passe</span><span className="relative block"><input id="activation-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••" value={password} required onChange={(e) => onPasswordChange(e.target.value)} className="h-13 w-full rounded-control border border-line bg-paper px-4 pr-12 text-body-sm text-ink placeholder-muted/50 outline-none transition focus:border-primary focus:bg-white focus:ring-0" /><button type="button" onClick={onTogglePassword} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-pill text-muted shadow-none transition hover:bg-line/50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3.5" />{showPassword && <path d="M3 3L21 21" strokeLinecap="round" />}</svg></button></span></label>
        {strength && <p className="flex items-center gap-3"><span className="flex flex-1 gap-1" aria-hidden="true">{[1, 2, 3, 4].map((segment) => <span key={segment} className={`h-1.5 flex-1 rounded-full ${segment <= strength.segments ? strength.colorClass.split(' ')[0] : 'bg-line'}`} />)}</span><span className={`text-label font-bold uppercase tracking-widest ${strength.colorClass.split(' ')[1]}`}>{strength.label}</span></p>}
        <ul className="grid grid-cols-1 gap-2 rounded-xl border border-line bg-paper p-4 sm:grid-cols-2">{criteria.map((criterion, index) => <li key={criterion.id} className="flex items-center gap-2 text-xs"><span className={`flex h-4 w-4 items-center justify-center rounded-full text-caption font-bold ${metCriteria[index] ? 'bg-emerald-600 text-white' : 'border border-line bg-white text-transparent'}`}>✓</span><span className={metCriteria[index] ? 'font-semibold text-emerald-800' : 'text-muted'}>{criterion.label}</span></li>)}</ul>
        <label className="block"><span className="mb-2 block text-meta font-bold uppercase tracking-label text-ink">Confirmez le mot de passe</span><span className="relative block"><input id="activation-confirm" type={showConfirm ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••" value={confirmPassword} required onChange={(e) => onConfirmChange(e.target.value)} className={`h-13 w-full rounded-control border bg-paper px-4 pr-12 text-body-sm text-ink outline-none focus:bg-white focus:ring-0 ${confirmPassword ? (confirmMatch ? 'border-emerald-500' : 'border-danger') : 'border-line'}`} /><button type="button" onClick={onToggleConfirm} aria-label={showConfirm ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-pill text-muted shadow-none transition hover:bg-line/50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3.5" />{showConfirm && <path d="M3 3L21 21" strokeLinecap="round" />}</svg></button></span></label>
        {confirmPassword && !confirmMatch && <p className="text-xs font-semibold text-danger" role="alert">Les mots de passe ne correspondent pas.</p>}
        {error && <p className="rounded-lg border-l-4 border-danger bg-rose-50/70 p-3.5 text-xs font-semibold leading-5 text-danger" role="alert">{error}</p>}
        <button type="submit" disabled={isLoading || !allMet || !confirmMatch} className="flex h-control w-full items-center justify-center rounded-lg bg-primary px-6 text-xs font-bold uppercase tracking-label text-white shadow-xs transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">{isLoading ? 'Activation en cours...' : 'Activer mon compte'}</button>
      </form>
      <footer className="mt-8 border-t border-line pt-6 text-center text-xs text-muted"><p>Plateforme municipale de la Ville de Feytiat.</p><p className="mt-1">Besoin d&apos;aide ? Contactez le <span className="font-semibold text-ink">service Vie associative</span>.</p></footer>
    </section>
  );
}
