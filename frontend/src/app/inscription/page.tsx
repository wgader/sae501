'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import FormField from '@/components/ui/FormField';
import { registerAssociation, ApiError } from '@/lib/api';

import BackButton from '@/components/ui/BackButton';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [isAccepted, setIsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAccepted) return;

    const form = event.currentTarget;
    const data = new FormData(form);

    const phone = data.get('phone') as string;
    if (!/^\d{10}$/.test(phone)) {
      setError('Le numéro de téléphone doit contenir exactement 10 chiffres.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await registerAssociation({
        nomAssociation: data.get('associationName') as string,
        nom: data.get('presidentLastName') as string,
        prenom: data.get('presidentFirstName') as string,
        email: data.get('email') as string,
        telephone: phone,
        cguAccepted: isAccepted,
      });
      router.push('/inscription/confirmation');
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.status) {
          case 409:
            setError('Cette adresse email est déjà utilisée.');
            break;
          case 429:
            setError('Trop de tentatives. Veuillez patienter quelques minutes.');
            break;
          case 422:
            setError('Certains champs sont invalides. Vérifiez les informations saisies.');
            break;
          case 400:
            setError('Veuillez remplir tous les champs obligatoires et accepter les CGU.');
            break;
          default:
            setError('Une erreur est survenue, veuillez réessayer.');
        }
      } else {
        setError('Impossible de contacter le serveur. Vérifiez votre connexion.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-white px-6 py-10 sm:px-10 lg:px-16">
      <div className="w-full max-w-155">
        {/* Mobile Back Button */}
        <div className="mb-6 lg:hidden">
          <BackButton className="text-ink" />
        </div>

        <header>
          <h1 className="text-[clamp(1.75rem,2.8vw,2.5rem)] font-black leading-[1.08] tracking-display text-ink">
            Parlez-nous de votre
            <span className="block text-primary">association</span>
          </h1>

          <p className="mt-3 text-body-sm text-muted">
            Tous les champs suivis d&apos;un astérisque (*) sont obligatoires.
          </p>
        </header>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-xs leading-5 text-danger" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <FormField
            label="Nom de l'association "
            name="associationName"
            type="text"
            placeholder="exemple : Feytiat Loisirs"
            required
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Nom du président "
              name="presidentLastName"
              type="text"
              placeholder="exemple : Dupont"
              required
            />
            <FormField
              label="Prénom du président "
              name="presidentFirstName"
              type="text"
              placeholder="exemple : Camille"
              required
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="E-mail "
              name="email"
              type="email"
              placeholder="exemple : contact@association.fr"
              required
            />
            <FormField
              label="Numéro de téléphone "
              name="phone"
              type="tel"
              placeholder="exemple : 0512345678"
              maxLength={10}
              required
            />
          </div>

          <label className="flex items-start gap-3 pt-2 text-body-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={isAccepted}
              onChange={(e) => setIsAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border border-line accent-primary"
            />
            <span>
              J&apos;accepte les conditions générales d&apos;utilisation (CGU).
            </span>
          </label>

          <div className="flex flex-col gap-4 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={!isAccepted || isLoading}
              className="inline-flex h-12 items-center justify-center gap-2.5 rounded-lg bg-primary px-6 text-xs font-bold uppercase tracking-label text-white shadow-xs transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{isLoading ? 'Envoi en cours...' : 'Envoyer la demande'}</span>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </button>

            <Link
              href="/connexion"
              className="text-body-sm font-semibold text-ink underline underline-offset-4 transition-colors hover:text-primary"
            >
              Déjà un compte ? Se connecter
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}