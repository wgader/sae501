'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import FormField from '@/components/ui/FormField';
import Notice from '@/components/ui/Notice';
import PasswordRequirements, { isPasswordValid } from '@/components/ui/PasswordRequirements';
import { confirmPasswordReset } from '@/lib/api/auth';

const linkClassName =
  'inline-flex h-control-compact items-center justify-center rounded-control bg-primary px-6 text-xs font-bold uppercase tracking-label text-white transition-colors hover:bg-primary-hover';

/** Choix d'un nouveau mot de passe depuis le lien reçu par e-mail. */
export default function ResetPasswordForm() {
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginPath, setLoginPath] = useState<string | null>(null);

  if (!token) {
    return (
      <Notice tone="danger" title="Lien incomplet" action={<Link href="/mot-de-passe-oublie" className={linkClassName}>Demander un nouveau lien</Link>}>
        Ouvrez le lien reçu par e-mail en entier, ou demandez-en un nouveau.
      </Notice>
    );
  }

  if (loginPath) {
    return (
      <Notice tone="success" title="Mot de passe modifié" action={<Link href={loginPath} className={linkClassName}>Se connecter</Link>}>
        Votre nouveau mot de passe est enregistré. Par sécurité, vos sessions ouvertes ailleurs ont été fermées.
      </Notice>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isPasswordValid(password)) {
      setError('Le mot de passe ne respecte pas toutes les règles.');
      return;
    }
    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await confirmPasswordReset(token, password);
      setLoginPath(result.loginPath);
    } catch (err) {
      console.error('Réinitialisation du mot de passe impossible', err);
      setError(err instanceof Error ? err.message : 'Le mot de passe n’a pas pu être modifié.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-5" noValidate onSubmit={handleSubmit}>
      <div>
        <FormField
          label="Nouveau mot de passe"
          type="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby="reset-password-rules"
          required
        />
        <PasswordRequirements id="reset-password-rules" password={password} />
      </div>
      <FormField
        label="Confirmer le mot de passe"
        type="password"
        name="confirmation"
        autoComplete="new-password"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        required
      />

      {error && <Notice tone="danger">{error}</Notice>}

      <button
        type="submit"
        disabled={isLoading}
        className="flex h-12 w-full items-center justify-center rounded-control bg-primary px-6 text-xs font-bold uppercase tracking-label text-white shadow-xs transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
      </button>
    </form>
  );
}
