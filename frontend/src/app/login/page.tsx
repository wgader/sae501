'use client';

import { type FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';
import ButtonView from '@/components/ui/ButtonView';
import BackButton from '@/components/ui/BackButton';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        window.dispatchEvent(new Event('auth-change'));
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
    <main className="min-h-screen bg-[var(--paper)] px-6 py-10 text-[var(--ink)] sm:px-10 sm:py-14">
      <section className="mx-auto w-full max-w-lg">
        <header className="mb-10">
          <BackButton className='text-[var(--ink)]' />
          <h1 className="text-3xl font-black uppercase tracking-[-0.055em] sm:text-[40px]">
            Se connecter
          </h1>
        </header>
        
        <form className="flex flex-col gap-7" noValidate onSubmit={handleSubmit}>
          <FormField
            label="Votre adresse électronique "
            type="text"
            name="identifier"
            placeholder="exemple : monadresse@domaine.fr"
            autoComplete="username"
            required
          />
          
          <FormField
            label="Votre mot de passe"
            type={showPassword ? 'text' : 'password'} 
            name="password"
            autoComplete="current-password"
            placeholder="●●●●●●●"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setSubmitError('');
            }}
            required
          >
          <ButtonView
                type="button"
                variant={showPassword ? 'selected' : 'unselected'}
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="relative start-[90%] translate-y-[150%] flex  text-[#111111]/70 hover:text-[#111111]"
              >
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3.5" />
                  {showPassword ? <path d="M3 3L21 21" strokeLinecap="round" /> : null}
                </svg>
              </ButtonView>
          </FormField>
          
          {submitError && (
            <p className="-mt-3 border-l-2 border-[var(--Flush-Mahogany)] pl-3 text-xs leading-5 text-[var(--Flush-Mahogany)]" role="alert">
              {submitError}
            </p>
          )}
          <a className="text-end text-xs font-bold text-[var(--ink)] underline underline-offset-2" href="/signup">
            Pas encore de compte ? 
          </a>
          <a className="mb-6 text-end text-xs font-bold text-[var(--ink)] underline underline-offset-2" href="/signup">
            Mot de passe oublié ?
          </a>
        
          <Button variant="primary"
           
            type="submit"
          >
            se connecter
          </Button>
        </form>
        
        
      </section>
    </main>
  );
}