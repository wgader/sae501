'use client';

import { FormEvent, useEffect, useState } from 'react';
import ValidatedInput from '@/components/ui/ValidatedInput';
import { ApiError, AccountProfile, getAccountProfile, updateAccountProfile } from '@/lib/api';

type ProfileForm = {
  email: string;
  telephone: string;
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export default function ProfilPage() {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>({ email: '', telephone: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;

    getAccountProfile()
      .then((data) => {
        if (!isMounted) return;
        setProfile(data);
        setForm({
          email: data.email ?? '',
          telephone: data.telephone ?? '',
        });
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(getErrorMessage(requestError, 'Impossible de charger votre profil.'));
        }
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
      setForm({
        email: updatedProfile.email ?? '',
        telephone: updatedProfile.telephone ?? '',
      });
      setSuccess('Vos informations ont bien été mises à jour.');
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Impossible de mettre à jour votre profil.'));
    } finally {
      setIsSaving(false);
    }
  }

  const fullName = [profile?.prenom, profile?.nom].filter(Boolean).join(' ') || 'Votre profil';

  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-[82rem]">
        <header className="border-b border-[#E7ECEB] pb-6">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[var(--Mosaic-Tile)]">
            Espace associations · Profil
          </p>
          <h1 className="mt-2 text-[clamp(2rem,3.5vw,2.75rem)] font-black tracking-[-0.03em] text-[var(--ink)]">
            Modifier mon profil
          </h1>
          <p className="mt-2 max-w-2xl text-[0.9375rem] leading-[1.6] text-[var(--muted)]">
            Gérez les coordonnées utilisées pour votre espace association.
          </p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(240px,0.7fr)_minmax(0,1.3fr)]">
          <section aria-labelledby="profile-summary" className="rounded-[24px] bg-[var(--Mosaic-Tile)] p-8 text-white sm:p-10">
            <h2 id="profile-summary" className="text-xl font-bold">
              Votre compte
            </h2>
            <div className="mt-8 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--Lime-Cream)] text-2xl font-black text-[var(--ink)]">
              {(profile?.prenom?.[0] ?? '') + (profile?.nom?.[0] ?? '') || '?'}
            </div>
            <p className="mt-6 text-2xl font-black tracking-[-0.02em]">{fullName}</p>
            <p className="mt-2 break-words text-sm text-white/75">{profile?.email ?? 'Chargement…'}</p>
          </section>

          <section aria-labelledby="profile-form" className="rounded-[24px] border border-[#E7ECEB] bg-[#F7FAF8] p-6 sm:p-10">
            <h2 id="profile-form" className="text-xl font-bold text-[var(--ink)]">
              Informations personnelles
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Ces informations permettent à la mairie de vous contacter au sujet de votre association.
            </p>

            {isLoading ? (
              <p className="mt-8 text-sm text-[var(--muted)]" role="status">Chargement de votre profil…</p>
            ) : (
              <form className="mt-8 flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
                <ValidatedInput
                  label="Adresse email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  required
                />
                <ValidatedInput
                  label="Téléphone"
                  name="telephone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="06 12 34 56 78"
                  value={form.telephone}
                  onChange={(event) => updateField('telephone', event.target.value)}
                />

                {error && (
                  <p className="rounded-lg border border-[#e9b8b8] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#9d3838]" role="alert">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="rounded-lg border border-[#b7d9c9] bg-[#f1faf5] px-4 py-3 text-sm font-semibold text-[#176044]" role="status">
                    {success}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex h-12 items-center justify-center rounded-[10px] bg-[var(--Mosaic-Tile)] px-6 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[var(--moss)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? 'Enregistrement…' : 'Enregistrer les modifications'}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
