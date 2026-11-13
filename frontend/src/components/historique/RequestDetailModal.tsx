'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  AssociationRequestDetail,
  getMediaUrl,
} from '@/lib/api';
import RequestStatusBadge from './RequestStatusBadge';
import RequestTypeBadge from './RequestTypeBadge';
import RequestTimeline, { formatDateTime } from './RequestTimeline';

export interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail: AssociationRequestDetail | null;
  isLoading: boolean;
  error: string | null;
}

export default function RequestDetailModal({
  isOpen,
  onClose,
  detail,
  isLoading,
  error,
}: RequestDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-detail-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog box */}
      <div
        ref={modalRef}
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-card border border-line bg-white shadow-2xl transition-all"
      >
        {/* Modal Header */}
        <header className="flex items-start justify-between border-b border-line p-5 sm:p-6">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              {detail && (
                <>
                  <RequestTypeBadge requestType={detail.type} label={detail.typeLabel} />
                  <RequestStatusBadge statusLabel={detail.statut} size="md" />
                </>
              )}
            </div>

            <h2
              id="request-detail-title"
              className="mt-2 text-xl font-black tracking-display text-ink sm:text-2xl"
            >
              {isLoading ? 'Chargement du dossier...' : detail?.intitule}
            </h2>

            {detail && (
              <p className="mt-1 text-xs text-muted">
                Référence dossier : <span className="font-semibold text-ink">{detail.id}</span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le détail du dossier"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line text-muted hover:bg-paper hover:text-ink cursor-pointer"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-8">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-8 w-8 animate-spin rounded-pill border-2 border-primary border-t-transparent" />
              <p className="mt-4 text-xs font-bold uppercase tracking-label text-muted">
                Récupération des données du dossier...
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-soft border border-danger/30 bg-danger/10 p-4 text-sm text-danger"
            >
              <p className="font-bold">Erreur de chargement</p>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {!isLoading && !error && detail && (
            <>
              {/* Section Dates Clés */}
              <section aria-labelledby="dates-heading" className="space-y-3">
                <h3 id="dates-heading" className="text-xs font-bold uppercase tracking-label text-muted">
                  Dates clés
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-soft border border-line bg-paper p-3.5">
                    <span className="block text-caption font-bold uppercase tracking-label text-muted">
                      Date de dépôt
                    </span>
                    <span className="mt-1 block text-sm font-semibold text-ink">
                      {formatDateTime(detail.keyDates?.depot || detail.createdAt)}
                    </span>
                  </div>

                  {detail.type === 'materiel' && (
                    <>
                      <div className="rounded-soft border border-line bg-paper p-3.5">
                        <span className="block text-caption font-bold uppercase tracking-label text-muted">
                          Date de retrait
                        </span>
                        <span className="mt-1 block text-sm font-semibold text-ink">
                          {formatDateTime(detail.keyDates?.retrait)}
                        </span>
                      </div>
                      <div className="rounded-soft border border-line bg-paper p-3.5">
                        <span className="block text-caption font-bold uppercase tracking-label text-muted">
                          Date de restitution
                        </span>
                        <span className="mt-1 block text-sm font-semibold text-ink">
                          {formatDateTime(detail.keyDates?.restitution)}
                        </span>
                      </div>
                    </>
                  )}

                  {detail.type === 'salle' && (
                    <>
                      <div className="rounded-soft border border-line bg-paper p-3.5">
                        <span className="block text-caption font-bold uppercase tracking-label text-muted">
                          Début du créneau
                        </span>
                        <span className="mt-1 block text-sm font-semibold text-ink">
                          {formatDateTime(detail.keyDates?.debut)}
                        </span>
                      </div>
                      <div className="rounded-soft border border-line bg-paper p-3.5">
                        <span className="block text-caption font-bold uppercase tracking-label text-muted">
                          Fin du créneau
                        </span>
                        <span className="mt-1 block text-sm font-semibold text-ink">
                          {formatDateTime(detail.keyDates?.fin)}
                        </span>
                      </div>
                    </>
                  )}

                  {detail.type === 'subvention' && (
                    <div className="rounded-soft border border-line bg-paper p-3.5 sm:col-span-2">
                      <span className="block text-caption font-bold uppercase tracking-label text-muted">
                        Exercice budgétaire
                      </span>
                      <span className="mt-1 block text-sm font-semibold text-ink">
                        Campagne {detail.anneeExercice || detail.year}
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* Section Spécifique au Type */}
              <section aria-labelledby="specifics-heading" className="space-y-3">
                <h3 id="specifics-heading" className="text-xs font-bold uppercase tracking-label text-muted">
                  Détail de la demande
                </h3>

                {/* Subvention Details */}
                {detail.type === 'subvention' && (
                  <div className="rounded-soft border border-line bg-paper p-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <span className="block text-caption font-bold uppercase tracking-label text-muted">
                          Montant sollicité
                        </span>
                        <span className="text-xl font-black text-ink">
                          {typeof detail.montantDemande === 'number'
                            ? `${detail.montantDemande.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`
                            : '—'}
                        </span>
                      </div>

                      {detail.montantAccorde !== null && detail.montantAccorde !== undefined && (
                        <div>
                          <span className="block text-caption font-bold uppercase tracking-label text-primary">
                            Montant accordé par la mairie
                          </span>
                          <span className="text-xl font-black text-primary">
                            {detail.montantAccorde.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                          </span>
                        </div>
                      )}
                    </div>

                    {detail.description && (
                      <div className="border-t border-line/60 pt-3">
                        <span className="block text-caption font-bold uppercase tracking-label text-muted">
                          Description du projet
                        </span>
                        <p className="mt-1 text-sm text-ink leading-relaxed">
                          {detail.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Matériel Details */}
                {detail.type === 'materiel' && (
                  <div className="space-y-3">
                    {detail.lignes && detail.lignes.length > 0 ? (
                      <div className="rounded-soft border border-line bg-paper divide-y divide-line/60">
                        {detail.lignes.map((ligne, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3.5">
                            <div className="flex items-center gap-3">
                              {ligne.imagePath ? (
                                <Image
                                  src={getMediaUrl(ligne.imagePath) || ''}
                                  alt={ligne.designation}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 rounded-control object-cover"
                                />
                              ) : (
                                <span className="flex h-10 w-10 items-center justify-center rounded-control bg-indigo/10 text-indigo font-bold text-xs">
                                  {ligne.designation.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                              <div>
                                <span className="block text-sm font-bold text-ink">
                                  {ligne.designation}
                                </span>
                                {ligne.categorie && (
                                  <span className="text-xs text-muted">
                                    {ligne.categorie}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className="rounded-control bg-white px-3 py-1 text-xs font-black text-ink border border-line">
                              Quantité : {ligne.quantite}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted">{detail.summary}</p>
                    )}

                    {detail.cautionMontant !== null && detail.cautionMontant !== undefined && (
                      <div className="rounded-soft border border-line bg-paper p-3 text-xs flex justify-between items-center">
                        <span className="text-muted font-bold uppercase tracking-label">
                          Caution requise
                        </span>
                        <span className="font-black text-ink">
                          {detail.cautionMontant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Salle Details */}
                {detail.type === 'salle' && (
                  <div className="rounded-soft border border-line bg-paper p-4 space-y-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="text-base font-bold text-ink">
                        {detail.salleNom || detail.summary}
                      </h4>
                      {detail.salleCapaciteMax && (
                        <span className="text-xs text-muted">
                          Capacité max : {detail.salleCapaciteMax} personnes
                        </span>
                      )}
                    </div>

                    {detail.salleAdresse && (
                      <p className="text-xs text-muted">
                        Adresse : {detail.salleAdresse}
                      </p>
                    )}

                    {detail.salleAccesPmr && (
                      <span className="inline-flex items-center gap-1.5 rounded-soft bg-primary-soft px-2.5 py-0.5 text-caption font-bold text-primary">
                        Accessible PMR
                      </span>
                    )}

                    {detail.capaciteAttendue && (
                      <p className="text-xs text-ink font-semibold">
                        Affluence attendue par l&apos;association : {detail.capaciteAttendue} personnes
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* Section Retours et Décisions Commune */}
              {(detail.decisionMotif || detail.observations) && (
                <section aria-labelledby="decision-heading" className="space-y-2">
                  <h3 id="decision-heading" className="text-xs font-bold uppercase tracking-label text-muted">
                    Observations & motifs de décision de la commune
                  </h3>
                  <div className="rounded-soft border border-primary/20 bg-primary-soft/50 p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-primary text-white text-xs font-bold">
                        i
                      </span>
                      <div className="text-sm leading-relaxed text-ink">
                        <p className="font-semibold text-primary">
                          Information communiquée par la Mairie de Feytiat :
                        </p>
                        <p className="mt-1">
                          {detail.decisionMotif || detail.observations}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Section Pièces Justificatives */}
              <section aria-labelledby="docs-heading" className="space-y-3">
                <h3 id="docs-heading" className="text-xs font-bold uppercase tracking-label text-muted">
                  Pièces justificatives associées
                </h3>

                {detail.documents && detail.documents.length > 0 ? (
                  <ul className="space-y-2">
                    {detail.documents.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex items-center justify-between rounded-soft border border-line bg-paper p-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate pr-3">
                          <svg
                            className="h-4 w-4 shrink-0 text-muted"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span className="truncate font-semibold text-ink">
                            {doc.typeDocument}
                          </span>
                        </div>

                        {doc.fichierUrl && (
                          <a
                            href={getMediaUrl(doc.fichierUrl) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 rounded-control border border-line bg-white px-2.5 py-1 text-caption font-bold uppercase tracking-label text-primary hover:bg-paper"
                          >
                            Consulter
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-soft border border-line bg-paper p-3 text-xs italic text-muted">
                    Aucune pièce justificative déposée pour cette démarche.
                  </p>
                )}
              </section>

              {/* Section Chronologie des étapes */}
              <section aria-labelledby="timeline-heading" className="space-y-4">
                <h3 id="timeline-heading" className="text-xs font-bold uppercase tracking-label text-muted">
                  Chronologie des étapes de traitement
                </h3>

                <RequestTimeline timeline={detail.timeline || []} />
              </section>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="flex justify-end border-t border-line p-4 sm:p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-control border border-line bg-paper px-5 py-2 text-xs font-bold uppercase tracking-label text-ink hover:bg-line/40 cursor-pointer"
          >
            Fermer
          </button>
        </footer>
      </div>
    </div>
  );
}
