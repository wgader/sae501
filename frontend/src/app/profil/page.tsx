'use client';

import { FormEvent, useEffect, useState, useSyncExternalStore } from 'react';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';
import { ApiError, AccountProfile, getAccountProfile, updateAccountProfile } from '@/lib/api';
import { getStoredAssociationName, getAssociationInitials, getStoredUserName, getUserInitials, getPersonInitials } from '@/lib/authUtils';

type ProfileForm = {
  email: string;
  telephone: string;
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m14.5 6.5 3 3M5 19l3.5-.8L18.8 7.9a2.1 2.1 0 0 0-3-3L5.5 14.8 5 19Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ProfilPage() {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>({ email: '', telephone: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const associationName = useSyncExternalStore(
    () => () => undefined,
    getStoredAssociationName,
    () => 'Feytiat Loisirs',
  );

  useEffect(() => {
    let isMounted = true;
    getAccountProfile()
      .then((data) => {
        if (!isMounted) return;
        setProfile(data);
        setForm({ email: data.email ?? '', telephone: data.telephone ?? '' });
      })
      .catch((requestError: unknown) => {
        if (isMounted) setError(getErrorMessage(requestError, 'Impossible de charger votre profil.'));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function updateField(field: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
    setSuccess('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const updatedProfile = await updateAccountProfile({
        email: form.email.trim(),
        telephone: form.telephone.trim() || null,
      });
      setProfile(updatedProfile);
      setForm({ email: updatedProfile.email ?? '', telephone: updatedProfile.telephone ?? '' });
      setSuccess('Vos informations ont bien été mises à jour.');
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Impossible de mettre à jour votre profil.'));
    } finally {
      setIsSaving(false);
    }
  }

  const userPrenom = profile?.prenom;
  const userNom = profile?.nom;
  const presidentName = [userPrenom, userNom].filter(Boolean).join(' ') || getStoredUserName();
  const associationTitle = profile?.nomAssociation || associationName;
  const displayName = presidentName || associationTitle;
  const initials = getPersonInitials(userPrenom, userNom) || (presidentName ? getUserInitials(presidentName) : getAssociationInitials(associationTitle));

  return (
    <div className="flex min-h-screen bg-white">

      <main className="min-w-0 flex-1 px-6 py-8 sm:px-10 lg:px-16 lg:py-10">
        <div className="mx-auto max-w-260">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="group mb-8 inline-flex items-center gap-3 text-xs uppercase tracking-label text-ink transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <svg viewBox="0 0 24 24" className="size-6 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5m6 6-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Retour
          </button>

          <header>
            <p className="text-label font-bold uppercase tracking-eyebrow text-primary">Mon compte</p>
            <h1 className="mt-2 text-[clamp(2.5rem,5vw,4rem)] font-black leading-none tracking-display text-black">Mon profil</h1>
            <p className="mt-3 text-body-sm text-muted">Gérez les coordonnées et les accès associés à votre compte.</p>
          </header>

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(13rem,17.5rem)_minmax(0,1fr)] lg:gap-12">
            <section aria-labelledby="profile-summary" className="border-b border-line pb-8 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-10">
              <div className="flex size-14 items-center justify-center rounded-full bg-accent text-xl font-black text-black sm:size-16">
                {initials}
              </div>
              <h2 id="profile-summary" className="mt-5 text-xl font-bold leading-tight text-black">{displayName}</h2>
              {presidentName && associationTitle && (
                <p className="mt-1 text-sm font-semibold text-primary">{associationTitle}</p>
              )}
              <p className="mt-2 text-xs text-muted">
                {profile?.typeCompte === 'mairie' ? 'Agent communal' : 'Président de l’association'}
              </p>
              <span className="mt-4 inline-flex rounded-pill bg-primary px-3 py-1.5 text-[0.55rem] font-bold uppercase tracking-label text-white">
                Compte vérifié
              </span>
            </section>

            <section aria-labelledby="profile-form" className="min-w-0">
              <div className="flex items-end justify-between border-b border-line pb-5">
                <div>
                  <p className="text-label font-bold uppercase tracking-section text-primary">Informations personnelles</p>
                  <h2 id="profile-form" className="mt-2 text-2xl font-bold text-black">Modifier votre profil</h2>
                </div>
                <span className="hidden text-primary sm:block" aria-hidden="true"><EditIcon /></span>
              </div>

              {isLoading ? (
                <p className="mt-8 text-sm text-muted" role="status">Chargement de votre profil…</p>
              ) : (
                <form className="mt-8 flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
                  <FormField
                    label="Numéro de téléphone"
                    name="telephone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="05 XX XX XX XX"
                    value={form.telephone}
                    onChange={(event) => updateField('telephone', event.target.value)}
                  />
                  <FormField
                    label="Adresse électronique"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="monadresse@domaine.fr"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    required
                  >
                    <button type="button" aria-label="Modifier l’adresse électronique" className="flex size-10 shrink-0 items-center justify-center rounded-soft text-ink transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                      <EditIcon />
                    </button>
                  </FormField>
                  <FormField label="Mot de passe" name="password" type="password" placeholder="••••••••" value="********" readOnly>
                    <button type="button" aria-label="Modifier le mot de passe" className="flex size-10 shrink-0 items-center justify-center rounded-soft text-ink transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                      <EditIcon />
                    </button>
                  </FormField>

                  {error && <p className="rounded-soft border border-danger/30 bg-red-50 px-4 py-3 text-sm font-semibold text-danger" role="alert">{error}</p>}
                  {success && <p className="rounded-soft border border-primary/30 bg-emerald-50 px-4 py-3 text-sm font-semibold text-primary" role="status">{success}</p>}

                  <div className="flex justify-end pt-1">
                    <Button type="submit" size="md" isLoading={isSaving} rightIcon={<span className="text-lg leading-none" aria-hidden="true">→</span>}>
                      Enregistrer les modifications
                    </Button>
                  </div>
                </form>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
