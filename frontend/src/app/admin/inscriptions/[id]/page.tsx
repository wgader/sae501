'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { type Association, type AssociationStatus, getAssociation, updateAssociationStatus } from '@/lib/api';

import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

export default function AssociationDetailPage() {
  const params = useParams();
  const idString = params?.id as string;
  const id = Number(idString);

  const [association, setAssociation] = useState<Association | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const loadData = useCallback(async () => {
    if (!id || Number.isNaN(id)) {
      setError('Identifiant d’association invalide.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await getAssociation(id);
      setAssociation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les détails de l’association.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const handleUpdateStatus = async (nextStatus: AssociationStatus) => {
    if (!association) return;
    setUpdating(true);
    setError('');
    setFeedbackMessage('');

    try {
      const updated = await updateAssociationStatus(association.id, nextStatus);
      setAssociation(updated);
      setFeedbackMessage(
        nextStatus === 'VALIDATED'
          ? 'L’inscription a bien été acceptée. Un e-mail d’activation a été transmis à l’association.'
          : nextStatus === 'REFUSED'
          ? 'La demande d’inscription a été refusée.'
          : 'Le dossier a été remis en attente d’instruction.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la mise à jour.');
    } finally {
      setUpdating(false);
    }
  };

  const formattedDate = association?.createdAt
    ? new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(association.createdAt))
    : 'Date non renseignée';

  return (
    <AdminLayout>
      <section className="mx-auto max-w-4xl">
        {/* ── Navigation retour ────────────────────────────── */}
        <nav aria-label="Retour à la liste" className="mb-6">
          <Link
            href="/admin/inscriptions"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-label text-primary transition-opacity hover:opacity-80"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Retour aux demandes d’inscription</span>
          </Link>
        </nav>

        {/* ── État de chargement ───────────────────────────── */}
        {loading && (
          <article className="py-20 text-center text-muted">
            <svg className="mx-auto h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider">Chargement de la demande...</p>
          </article>
        )}

        {/* ── Erreur ───────────────────────────────────────── */}
        {error && (
          <p className="mb-6 rounded-lg border-l-4 border-danger bg-rose-50/70 p-4 text-xs font-semibold leading-5 text-danger" role="alert">
            {error}
          </p>
        )}

        {/* ── Message de succès ────────────────────────────── */}
        {feedbackMessage && (
          <p className="mb-6 rounded-lg border-l-4 border-emerald-600 bg-emerald-50/80 p-4 text-xs font-semibold leading-5 text-emerald-800" role="status">
            {feedbackMessage}
          </p>
        )}

        {/* ── Contenu principal de la fiche ─────────────────── */}
        {!loading && association && (
          <article className="space-y-6">
            {/* En-tête de la fiche */}
            <header className="rounded-2xl border border-line bg-paper p-6 sm:p-8">
              <span className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-label font-bold uppercase tracking-kicker text-primary">
                  Dossier d’inscription #{association.id}
                </span>

                <StatusBadge status={association.statut} size="md" />
              </span>

              <h1 className="mt-3 text-2xl sm:text-3xl font-black uppercase tracking-tight text-ink">
                {association.nom}
              </h1>

              <p className="mt-2 text-xs text-muted">
                Demande déposée le <strong className="text-ink font-semibold">{formattedDate}</strong>
              </p>
            </header>

            {/* Grille d'informations */}
            <section className="grid grid-cols-1 gap-6 md:grid-cols-2" aria-labelledby="heading-association-info">
              <h2 id="heading-association-info" className="sr-only">Informations détaillées de la demande</h2>

              {/* Bloc 1 : Coordonnées de l'association */}
              <article className="rounded-2xl border border-line bg-white p-6 sm:p-7 shadow-xs">
                <header className="flex items-center gap-3 border-b border-line pb-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </span>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                    Structure associative
                  </h3>
                </header>

                <ul className="mt-5 space-y-4 text-xs">
                  <li>
                    <span className="block text-label font-medium text-muted">Nom officiel</span>
                    <span className="mt-1 block text-sm font-bold text-ink">{association.nom}</span>
                  </li>
                  <li>
                    <span className="block text-label font-medium text-muted">Numéro RNA</span>
                    <span className="mt-1 block text-sm font-semibold text-ink">
                      {association.numeroRna || 'Non communiqué'}
                    </span>
                  </li>
                  <li>
                    <span className="block text-label font-medium text-muted">Date & heure de soumission</span>
                    <span className="mt-1 block text-sm font-semibold text-ink">{formattedDate}</span>
                  </li>
                </ul>
              </article>

              {/* Bloc 2 : Président et contact */}
              <article className="rounded-2xl border border-line bg-white p-6 sm:p-7 shadow-xs">
                <header className="flex items-center gap-3 border-b border-line pb-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-ink">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                    Président & Correspondant
                  </h3>
                </header>

                {association.contact ? (
                  <ul className="mt-5 space-y-4 text-xs">
                    <li>
                      <span className="block text-label font-medium text-muted">Nom et Prénom</span>
                      <span className="mt-1 block text-sm font-bold text-ink">
                        {association.contact.prenom} {association.contact.nom}
                      </span>
                    </li>
                    <li>
                      <span className="block text-label font-medium text-muted">Adresse électronique</span>
                      <a
                        href={`mailto:${association.contact.email}`}
                        className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-primary underline underline-offset-2 hover:opacity-85"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{association.contact.email}</span>
                      </a>
                    </li>
                    <li>
                      <span className="block text-label font-medium text-muted">Numéro de téléphone</span>
                      {association.contact.telephone ? (
                        <a
                          href={`tel:${association.contact.telephone}`}
                          className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-ink hover:text-primary"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{association.contact.telephone}</span>
                        </a>
                      ) : (
                        <span className="mt-1 block text-sm text-muted">Non renseigné</span>
                      )}
                    </li>
                  </ul>
                ) : (
                  <p className="mt-5 text-xs text-muted">Aucun contact principal associé à cette demande.</p>
                )}
              </article>
            </section>

            {/* ── Actions de validation / refus ────────────────── */}
            <footer className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-6 sm:p-8">
              <span className="text-xs text-muted">
                {association.statut === 'PENDING_VALIDATION'
                  ? 'Une décision d’acceptation déclenche l’envoi du lien d’activation à l’association.'
                  : association.statut === 'VALIDATED'
                  ? 'Le compte associatif est validé et actif.'
                  : 'Cette demande a été rejetée.'}
              </span>

              <span className="flex flex-wrap items-center gap-3">
                {association.statut === 'PENDING_VALIDATION' && (
                  <>
                    <Button
                      variant="danger"
                      disabled={updating}
                      onClick={() => handleUpdateStatus('REFUSED')}
                      leftIcon={
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      }
                    >
                      Refuser la demande
                    </Button>

                    <Button
                      variant="primary"
                      isLoading={updating}
                      onClick={() => handleUpdateStatus('VALIDATED')}
                      leftIcon={
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      }
                    >
                      Accepter l’inscription
                    </Button>
                  </>
                )}

                {association.statut === 'VALIDATED' && (
                  <Button
                    variant="danger"
                    isLoading={updating}
                    onClick={() => handleUpdateStatus('REFUSED')}
                  >
                    Suspendre / Refuser
                  </Button>
                )}

                {association.statut === 'REFUSED' && (
                  <Button
                    variant="primary"
                    isLoading={updating}
                    onClick={() => handleUpdateStatus('PENDING_VALIDATION')}
                  >
                    Remettre en attente
                  </Button>
                )}
              </span>
            </footer>
          </article>
        )}
      </section>
    </AdminLayout>
  );
}
