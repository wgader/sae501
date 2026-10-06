'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Header from '@/components/layout/Header';
import HelpSidebar from '@/components/shared/HelpSidebar';
import Stepper from '@/components/shared/Stepper';
import ValidatedInput from '@/components/ui/ValidatedInput';
import CategorySelector from '@/components/ui/CategorySelector';
import Link from 'next/link';
import { useSignupContext } from '@/context/SignupContext';

export default function AssociationPage() {
  const router = useRouter();
  const [formError, setFormError] = useState('');
  const { association, setAssociation } = useSignupContext();
  
  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    const isRna = /^W\d{9}$/.test(association.numeroRna);
    const isSiret = /^\d{14}$/.test(association.numeroSiret);

    if (!isRna && !isSiret) {
      setFormError('Erreur : vous devez fournir un numéro RNA valide (ex: W123456789) ou un SIRET valide (14 chiffres exacts sans espace).');
      return;
    }

    if (new Date(association.dateCreation) > new Date()) {
      setFormError('Erreur de déclaration : la date de création de l\'association ne peut pas être dans le futur.');
      return;
    }
    
    if (association.nombreMembres < 2) {
      setFormError('Erreur : l\'association doit déclarer au minimum 2 membres actifs fondateurs.');
      return;
    }

    if (association.adresseSiegeSocial.length < 10 || !/\d/.test(association.adresseSiegeSocial) || !/[a-zA-Z]/.test(association.adresseSiegeSocial)) {
      setFormError('Erreur : l\'adresse du siège social semble invalide. Veuillez renseigner une adresse complète (ex: 12 rue des Lilas).');
      return;
    }

    router.push('/signup/step2');
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <Stepper currentStep={1} />

        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <form onSubmit={handleSubmit} className="rounded-xl border border-[#d9ded9] p-4 shadow-sm sm:p-8">
            
            {formError && (
              <div className="mb-8 flex items-start gap-3 rounded-md border border-[#f3dada] bg-[#fdf2f2] p-4 text-[#b54b4b] shadow-sm animate-in fade-in">
                <svg className="mt-0.5 h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-bold leading-relaxed">{formError}</p>
              </div>
            )}

            <div className="mb-8">
              <h2 className="mb-6 border-l-4 border-[#0b644d] pl-3 text-xs font-bold uppercase tracking-widest text-[#1e2420] sm:mb-8">
                INFORMATIONS GÉNÉRALES
              </h2>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                <ValidatedInput 
                  label="Nom de l'association *" 
                  name="nom" 
                  value={association.nom}
                  onChange={(e) => setAssociation({ nom: e.target.value })}
                  placeholder="Ex. Les amis du parc" 
                  required
                />
                
                <ValidatedInput 
                  label="Numéro RNA (Optionnel si SIRET)" 
                  name="numeroRna" 
                  value={association.numeroRna}
                  onChange={(e) => setAssociation({ numeroRna: e.target.value })}
                  placeholder="W123456789" 
                  maxLength={10}
                />

                <ValidatedInput 
                  label="Numéro SIRET (Optionnel si RNA)" 
                  name="numeroSiret" 
                  value={association.numeroSiret}
                  onChange={(e) => setAssociation({ numeroSiret: e.target.value })}
                  placeholder="14 chiffres" 
                  maxLength={14}
                />
                
                <ValidatedInput 
                  label="Date de création *" 
                  type="date"
                  name="dateCreation" 
                  value={association.dateCreation}
                  onChange={(e) => setAssociation({ dateCreation: e.target.value })}
                  max={todayStr}
                  required
                />
                <ValidatedInput 
                  label="Nombre de membres *" 
                  type="number"
                  name="nombreMembres" 
                  value={association.nombreMembres || ''}
                  onChange={(e) => setAssociation({ nombreMembres: parseInt(e.target.value) || 0 })}
                  min="2"
                  required
                />

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-bold text-[#1e2420]">Catégorie d'activité *</label>
                  <select name="categorieActivite" value={association.categorieActivite} onChange={(e) => setAssociation({ categorieActivite: e.target.value })} className="w-full rounded-md border border-[#d9ded9] bg-white px-3 py-3 text-sm outline-none focus:border-[#0b644d] focus:ring-1 focus:ring-[#0b644d]" required>
                    <option value="Sportive">Sportive</option>
                    <option value="Culturelle">Culturelle</option>
                    <option value="Sociale">Sociale</option>
                    <option value="Environnement">Environnement</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="objet" className="mb-2 block text-xs font-bold text-[#1e2420]">Objet de l'association *</label>
                  <textarea id="objet" name="objet" required rows={3} value={association.objet} onChange={(e) => setAssociation({ objet: e.target.value })} placeholder="Décrivez brièvement les activités de votre association..." className="w-full resize-y rounded-md border border-[#d9ded9] bg-white px-3 py-3 text-sm outline-none focus:border-[#0b644d] focus:ring-1 focus:ring-[#0b644d]" />
                </div>

                <div className="sm:col-span-2">
                  <ValidatedInput label="Adresse du siège social *" name="adresseSiegeSocial" value={association.adresseSiegeSocial} onChange={(e) => setAssociation({ adresseSiegeSocial: e.target.value })} placeholder="12 rue des Lilas, 87220 Feytiat" required />
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse justify-between gap-6 border-t border-[#d9ded9] pt-6 sm:mt-12 sm:flex-row sm:items-center">
              <a href="#" className="text-center text-xs text-[#6d746e] hover:text-[#1e2420] hover:underline sm:text-left">
                  Besoin d'aide ? Contactez la mairie 
              </a>
              
              <div className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row sm:gap-6">
                <div className="flex w-full gap-3 sm:w-auto">
                  <Link 
                    href="/"
                    className="flex-1 rounded-md border border-[#d9ded9] bg-white px-4 py-3 text-center text-xs font-bold text-[#1e2420] transition-colors hover:bg-[#f7f8f4] sm:flex-none sm:px-6"
                  >
                      Retour
                  </Link>
                  <button
                    type="submit"
                    className="flex-1 rounded-md bg-[#0b644d] px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-[#084e3c] sm:flex-none sm:px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuer →
                  </button>
                </div>
              </div>
            </div>
          </form>

          <HelpSidebar />
        </div>
      </main>
    </div>
  );
}