'use client';

import React, { useState } from 'react';
import { type Association, type AssociationModule, type AssociationStatus } from '@/lib/api';
import { StatusBadge } from './StatusBadge';
import StatusTag from './StatusTag';

export interface DemandeDetailProps {
  association: Association;
  onBack: () => void;
  onUpdateStatus: (association: Association, status: AssociationStatus) => Promise<void>;
  isUpdating?: boolean;
}

export function DemandeDetail({
  association,
  onBack,
  onUpdateStatus,
  isUpdating = false,
}: DemandeDetailProps) {
  const [internalNote, setInternalNote] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const contact = association.contact;

  const depositDate = association.createdAt
    ? new Date(association.createdAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    : 'Date non renseignée';

  async function handleStatusChange(nextStatus: AssociationStatus, label: string) {
    if (!window.confirm(`Confirmer l'action « ${label} » pour l'association « ${association.nom} » ?`)) {
      return;
    }
    setFeedback(null);
    try {
      await onUpdateStatus(association, nextStatus);
      setFeedback({
        type: 'success',
        message: `Le statut de l'association a été mis à jour avec succès (${label}).`,
      });
    } catch {
      setFeedback({
        type: 'error',
        message: 'Erreur lors de la mise à jour du statut dans la base de données.',
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-[#146e67] transition-colors focus:outline-none"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour aux demandes
        </button>
      </div>

      {/* Main Title Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Demande d'inscription
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-slate-900">
            {association.nom}
          </h1>
          <StatusTag status={association.statut} />
        </div>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`rounded-xl border p-4 text-sm font-medium ${feedback.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Two columns layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Association identity & Demande info */}
        <div className="space-y-6 lg:col-span-7">
          {/* IDENTITÉ DE L'ASSOCIATION */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Identité de l&apos;association
            </h2>
            <div className="mt-4 border-t border-slate-100 pt-4 space-y-4">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nom de l'association
                </span>
                <span className="mt-0.5 block text-sm font-semibold text-slate-900 uppercase">
                  {association.nom}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Représentant(e)
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-slate-800">
                    {contact?.nomComplet || 'Non renseigné'}
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    E-mail
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-slate-800 break-all">
                    {contact?.email || 'Non renseigné'}
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Téléphone
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-slate-800">
                    {contact?.telephone || 'Non renseigné'}
                  </span>
                </div>
              </div>

              {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Numéro RNA
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-slate-800">
                    {association.numeroRna || 'Non renseigné'}
                  </span>
                </div> */}

              {/* <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Numéro SIRET
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-slate-800">
                    {association.numeroSiret || 'Non renseigné'}
                  </span>
                </div>
              </div> */}

              {/* {(association.adresseSiegeSocial || association.siteWeb || association.categorieActivite) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  {association.adresseSiegeSocial && (
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Siège social
                      </span>
                      <span className="mt-0.5 block text-xs font-medium text-slate-800">
                        {association.adresseSiegeSocial}
                      </span>
                    </div>
                  )}

                  {association.categorieActivite && (
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Catégorie d&apos;activité
                      </span>
                      <span className="mt-0.5 block text-xs font-medium text-slate-800">
                        {association.categorieActivite}
                      </span>
                    </div>
                  )}

                  {association.siteWeb && (
                    <div className="sm:col-span-2">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Site Web
                      </span>
                      <a
                        href={association.siteWeb.startsWith('http') ? association.siteWeb : `https://${association.siteWeb}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 block text-xs font-medium text-[#146e67] underline"
                      >
                        {association.siteWeb}
                      </a>
                    </div>
                  )}
                </div>
              )} */}
            </div>
          </div>

          {/* INFORMATIONS DE LA DEMANDE */}
          {/* <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Informations de la demande
            </h2>
            <div className="mt-4 border-t border-slate-100 pt-4 space-y-4">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Date de dépôt
                </span>
                <span className="mt-0.5 block text-xs font-medium text-slate-800">
                  {depositDate}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Objet de la demande
                </span>
                <p className="mt-1 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {association.objet || 'Aucun objet renseigné dans le dossier.'}
                </p>
              </div>
            </div>
          </div> */}
        </div>

        {/* Right Column: Modules habilités & Décision */}
        <div className="space-y-6 lg:col-span-5">
          {/* MODULES ACCORDÉS */}
          {/* <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Modules &amp; Habilitations
            </h2>
            <p className="mt-1 text-[11px] text-slate-400">
              Accès aux fonctionnalités de la plateforme municipale
            </p>
            <div className="mt-4 space-y-2.5">
              {[
                { id: 'subventions' as const, label: 'Subventions financières', icon: '💶' },
                { id: 'salles' as const, label: 'Réservation de salles', icon: '🏛️' },
                { id: 'materiel' as const, label: 'Emprunts de matériel', icon: '📦' },
              ].map((mod) => {
                const isEnabled = association.permissions?.includes(mod.id as AssociationModule) ?? false;
                return (
                  <div
                    key={mod.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                  >
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800">
                      <span>{mod.icon}</span>
                      <span>{mod.label}</span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isEnabled
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                        }`}
                    >
                      {isEnabled ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div> */}

          {/* DÉCISION */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Décision
            </h2>
            <p className="mt-1 text-[11px] text-slate-400">
              Une notification sera envoyé à l'association
            </p>

            <div className="mt-4">
              {/* <label htmlFor="internal-note" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Ajouter une note interne (facultatif)
              </label> */}
              <textarea
                id="internal-note"
                rows={3}
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Ajouter une note interne (facultatif)."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#146e67] focus:outline-none focus:ring-2 focus:ring-[#146e67]/15 transition-all"
              />
            </div>

            <div className="mt-5 space-y-2">
              {association.statut === 'PENDING_VALIDATION' && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('REFUSED', 'Refuser')}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 active:bg-rose-100 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-200"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Refuser
                  </button>

                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('VALIDATED', 'Valider')}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#146e67] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#0f5953] active:bg-[#0c4a45] disabled:opacity-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#146e67]/30"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Accepter
                  </button>
                </div>
              )}

              {association.statut === 'REFUSED' && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('PENDING_VALIDATION', 'Remettre en attente')}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-200"
                  >
                    ↺ En attente
                  </button>

                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('VALIDATED', 'Valider')}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#146e67] px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#0f5953] disabled:opacity-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#146e67]/30"
                  >
                    ✓ Valider
                  </button>
                </div>
              )}

              {association.statut === 'VALIDATED' && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('PENDING_VALIDATION', 'Remettre en attente')}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-200"
                  >
                    ↺ En attente
                  </button>

                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('REFUSED', 'Refuser')}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-200"
                  >
                    ✕ Refuser
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}

export default DemandeDetail;
