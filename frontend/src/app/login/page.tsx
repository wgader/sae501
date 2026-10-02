'use client';

import { type FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import FormField from '../../components/ui/FormField';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState('');
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const identifier = formData.get('identifier');

    if (!identifier || !password) {
      setSubmitError('Veuillez renseigner votre identifiant et votre mot de passe.');
      return;
    }

    setSubmitError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: identifier, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Identifiants incorrects');
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      router.push('/'); 
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Une erreur est survenue lors de la connexion');
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] px-6 py-10 text-[#1e2420] sm:px-10 sm:py-14">
      <section className="mx-auto w-full max-w-lg">
        <header className="mb-10">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#496a56]">
            Bon retour
          </p>
          <h1 className="text-3xl font-black uppercase tracking-[-0.055em] sm:text-[40px]">
            Se connecter
          </h1>
        </header>
        
        <form className="flex flex-col gap-7" noValidate onSubmit={handleSubmit}>
          <FormField
            label="Adresse électronique ou téléphone"
            type="text"
            name="identifier"
            placeholder="exemple : monadresse@domaine.fr"
            autoComplete="username"
            required
          />
          
          <FormField
            label="Votre mot de passe"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setSubmitError('');
            }}
            required
          />
          
          {submitError && (
            <p className="-mt-3 border-l-2 border-[#b54b4b] pl-3 text-xs leading-5 text-[#b54b4b]" role="alert">
              {submitError}
            </p>
          )}
          
          <button
            className="w-full bg-[#1e2420] px-5 py-4 text-xs font-bold uppercase tracking-[0.15em] text-white transition hover:bg-[#496a56] focus:outline-none focus:ring-4 focus:ring-[#496a56]/20"
            type="submit"
          >
            Connexion
          </button>
        </form>
        
        <p className="mt-6 text-center text-xs text-[#1e2420]">
          Vous n&apos;avez pas encore de compte ?{' '}
          <a className="font-bold text-[#496a56] underline underline-offset-2" href="/signup/step1">
            Sinscrire
          </a>
        </p>
      </section>
    </main>
  );
}