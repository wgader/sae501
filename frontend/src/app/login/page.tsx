'use client';

import { type FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!identifier || !password) {
      setSubmitError('Veuillez renseigner votre identifiant et votre mot de passe.');
      return;
    }

    setSubmitError('');

    try {
     const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
  method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Identifiants incorrects');
      }

      // Le backend peut renvoyer un 200 avec error: true (compte non vérifié, suspendu, etc.)
      if (data.error) {
        throw new Error(data.message || 'Une erreur est survenue');
      }

      if (!data.token) {
        throw new Error('Réponse invalide du serveur');
      }

      localStorage.setItem('token', data.token);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      router.push('/admin/dashboard'); 
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Une erreur est survenue');
      }
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-20 font-sans text-black sm:px-10">
      <section className="mx-auto w-full max-w-2xl">
        
        <header className="mb-12">
          <h1 className="text-2xl font-bold uppercase tracking-[0.1em]">
            Se connecter
          </h1>
        </header>
        
        {submitError && (
          <p className="mb-6 border-l-4 border-red-500 bg-red-50 p-4 text-sm font-bold text-red-700" role="alert">
            {submitError}
          </p>
        )}
        
        <form className="flex flex-col w-full" noValidate onSubmit={handleSubmit}>
          
          {/* CHAMP : IDENTIFIANT */}
          <div className="mb-8 w-full">
            <label className="mb-3 block text-xs font-bold uppercase tracking-widest">
              Identifiant / E-mail
            </label>
            <input
              type="text"
              name="identifier"
              autoComplete="username"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setSubmitError('');
              }}
              placeholder="Exemple: monadresse@domaine.fr ou 05 XX XX XX XX"
              className="w-full bg-[#d9d9d9] p-4 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#116c60]"
              required
            />
          </div>
          
          {/* CHAMP : MOT DE PASSE */}
          <div className="mb-4 w-full">
            <label className="mb-3 block text-xs font-bold uppercase tracking-widest">
              Votre mot de passe
            </label>
            <div className="relative w-full">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setSubmitError('');
                }}
                className="w-full bg-[#d9d9d9] p-4 pr-12 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#116c60]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transform text-gray-600 hover:text-black focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {showPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          
          {/* LIENS (ALIGNÉS À DROITE) */}
          <div className="mb-10 flex w-full flex-col items-end space-y-2">
            <a href="/signup/step1" className="text-xs font-bold tracking-wide underline hover:text-gray-600">
              Pas encore de compte ?
            </a>
            <a href="#" className="text-xs font-bold tracking-wide underline hover:text-gray-600">
              Mot de passe oublié ?
            </a>
          </div>
          
          {/* CHECKBOX "RESTER CONNECTÉ" */}
          <div className="mb-12 flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setRememberMe(!rememberMe)}
              className="flex h-7 w-7 items-center justify-center bg-[#d9d9d9] focus:outline-none"
            >
              {rememberMe && (
                <svg className="h-5 w-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
            <span className="text-xs font-bold tracking-wide">Rester connecté ?</span>
          </div>
          
          {/* BOUTON SOUMETTRE (ALIGNÉ À GAUCHE) */}
          <div>
            <button
              className="bg-[#116c60] px-8 py-3 text-sm font-bold tracking-widest text-white transition hover:bg-[#0d554a] focus:outline-none"
              type="submit"
            >
              SE CONNECTER
            </button>
          </div>

        </form>
      </section>
    </main>
  );
}