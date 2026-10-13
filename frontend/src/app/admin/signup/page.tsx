'use client';

import { type FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/admin/Button';
import { Input } from '@/components/admin/Input';
import { Label } from '@/components/admin/Label';

export default function AdminSignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSubmitError('');
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setSubmitError('Veuillez remplir tous les champs.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setSubmitError('Les mots de passe ne correspondent pas.');
      return;
    }

    setSubmitError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost'}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: formData.name, 
          email: formData.email, 
          password: formData.password 
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'inscription');
      }

      router.push('/admin'); 
      
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
            Inscription Mairie
          </h1>
        </header>
        
        {submitError && (
          <p className="mb-6 border-l-4 border-red-500 bg-red-50 p-4 text-sm font-bold text-red-700" role="alert">
            {submitError}
          </p>
        )}
        
        <form className="flex flex-col w-full" noValidate onSubmit={handleSubmit}>
          
          <div className="mb-8 w-full">
            <Label>Nom de la mairie</Label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Mairie de Paris"
              required
            />
          </div>

          <div className="mb-8 w-full">
            <Label>E-mail de contact</Label>
            <Input
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="contact@mairie.fr"
              required
            />
          </div>
          
          <div className="mb-8 w-full">
            <Label>Mot de passe</Label>
            <div className="relative w-full">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                className="pr-12"
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

          <div className="mb-10 w-full">
            <Label>Confirmer le mot de passe</Label>
            <Input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-10 flex w-full flex-col items-end space-y-2">
            <a href="/admin" className="text-xs font-bold tracking-wide underline hover:text-gray-600">
              Déjà un compte ? Se connecter
            </a>
          </div>
          
          <div>
            <Button type="submit">
              S'INSCRIRE
            </Button>
          </div>

        </form>
      </section>
    </main>
  );
}
