'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import ReCAPTCHA from 'react-google-recaptcha';
import Header from '@/components/layout/Header';
import Stepper from '@/components/shared/Stepper';
import TermsModal from '@/components/ui/TermsModal';
import { useSignupContext } from '@/context/SignupContext';

const CheckCircleIcon = () => (
  <svg className="h-6 w-6 text-[#0b644d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function ConfirmationPage() {
  const { user, association, cguAccepted } = useSignupContext();
  
  const [hasConsented, setHasConsented] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    
    if (hasConsented && captchaToken) {
      setIsSubmitting(true);
      
      try {
        const payload = {
          email: user.email,
          password: user.password,
          nom: user.nom,
          prenom: user.prenom,
          telephone: user.telephone,
          cguAccepted: cguAccepted,
          association: {
            nom: association.nom,
            numeroRna: association.numeroRna || "W000000000",
            numeroSiret: association.numeroSiret || "00000000000000",
            dateCreation: association.dateCreation,
            nombreMembres: association.nombreMembres,
            categorieActivite: association.categorieActivite,
            objet: association.objet,
            adresseSiegeSocial: association.adresseSiegeSocial,
            siteWeb: association.siteWeb
          }
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost'}/api/auth/register/association`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || (data.errors ? Object.values(data.errors).join(', ') : 'Une erreur est survenue lors de la création du compte.'));
        }

        setIsSubmitted(true);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setSubmitError(err.message);
        } else {
          setSubmitError('Une erreur est survenue de notre côté.');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#f2f7f5]">
            <CheckCircleIcon />
          </div>
          <h1 className="mb-4 text-3xl font-black uppercase tracking-tight text-[#1e2420] sm:text-4xl">
            Demande envoyée
          </h1>
          <p className="mb-8 text-base text-[#4f5851]">
            Votre dossier d'inscription pour l'association a bien été transmis à la mairie de Feytiat.<br className="hidden sm:block" />
            Il sera examiné sous <strong>48h ouvrées</strong>. Vous recevrez un email de confirmation de la part de nos services.
          </p>
          <Link
            href="/"
            className="rounded-md bg-[#0b644d] px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-[#084e3c]"
          >
            Retour à l'accueil
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <Stepper currentStep={4} />

        <div className="mx-auto max-w-3xl">
          <form className="rounded-xl border border-[#d9ded9] p-4 shadow-sm sm:p-8" onSubmit={handleSubmit}>
            
            {submitError && (
              <div className="mb-8 flex items-start gap-3 rounded-md border border-[#f3dada] bg-[#fdf2f2] p-4 text-[#b54b4b] shadow-sm animate-in fade-in">
                <svg className="mt-0.5 h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-bold leading-relaxed">{submitError}</p>
              </div>
            )}

            <div className="mb-8 text-center sm:text-left">
              <h2 className="mb-2 text-2xl font-black uppercase tracking-tight text-[#1e2420]">
                Dernière étape avant l'envoi
              </h2>
              <p className="text-sm text-[#6d746e]">
                Veuillez vérifier que vous avez bien complété toutes les étapes avant de soumettre votre dossier.
              </p>
            </div>

            <div className="mb-10 rounded-lg bg-[#f7f8f4] p-5 sm:p-7">
              <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-[#1e2420]">
                Récapitulatif de votre dossier
              </h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-4 text-sm text-[#1e2420]">
                  <CheckCircleIcon />
                  <div>
                    <strong className="block">1. Informations générales</strong>
                    <span className="text-xs text-[#6d746e]">{association.nom || 'Incomplet'}</span>
                  </div>
                </li>
                <li className="flex items-center gap-4 text-sm text-[#1e2420]">
                  <CheckCircleIcon />
                  <div>
                    <strong className="block">2. Contacts et responsables</strong>
                    <span className="text-xs text-[#6d746e]">{user.email || 'Incomplet'}</span>
                  </div>
                </li>
                <li className="flex items-center gap-4 text-sm text-[#1e2420]">
                  <CheckCircleIcon />
                  <div>
                    <strong className="block">3. Documents justificatifs</strong>
                    <span className="text-xs text-[#6d746e]">Statuts, récépissé et liste du bureau uploadés.</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="mb-8 flex items-start gap-3">
              <input
                type="checkbox"
                id="consent"
                required
                checked={hasConsented}
                onChange={(e) => setHasConsented(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 rounded border-[#d9ded9] text-[#0b644d] focus:ring-[#0b644d]"
              />
              <label htmlFor="consent" className="text-sm leading-relaxed text-[#4f5851]">
                Je certifie sur l'honneur l'exactitude des informations fournies dans ce formulaire et j'accepte que ces données soient traitées par la mairie de Feytiat dans le cadre de la gestion des associations, conformément aux <button type="button" onClick={() => setIsTermsOpen(true)} className="font-bold text-[#0b644d] underline">conditions générales d'utilisation</button>. *
              </label>
            </div>

           <div className="mb-10 flex justify-center sm:justify-start">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                onChange={(token) => setCaptchaToken(token)}
                onExpired={() => setCaptchaToken(null)}
              />
            </div>

            <div className="flex flex-col-reverse justify-between gap-6 border-t border-[#d9ded9] pt-6 sm:flex-row sm:items-center">
              <a href="#" className="text-center text-xs text-[#6d746e] hover:text-[#1e2420] hover:underline sm:text-left">
                Besoin d'aide ? Contactez la mairie 
              </a>
              
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link
                  href="/signup/step3"
                  className="flex-1 rounded-md border border-[#d9ded9] bg-white px-6 py-3 text-center text-xs font-bold text-[#1e2420] transition-colors hover:bg-[#f7f8f4] sm:flex-none"
                >
                    Retour
                </Link>
                
                <div className="group relative flex-1 sm:flex-none">
                  <button
                    type="submit"
                    disabled={!hasConsented || !captchaToken || isSubmitting}
                    className="w-full rounded-md bg-[#0b644d] px-8 py-3 text-xs font-bold text-white transition-colors hover:bg-[#084e3c] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isSubmitting ? 'Envoi...' : 'Soumettre mon dossier'}
                  </button>
                  
                  {(!hasConsented || !captchaToken) && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#1e2420] px-3 py-2 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                      Cochez les cases requises pour terminer
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      {isTermsOpen && <TermsModal onClose={() => setIsTermsOpen(false)} />}
    </div>
  );
}