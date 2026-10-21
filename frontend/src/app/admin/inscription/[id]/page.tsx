'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { type Association, type AssociationStatus, getAssociation, updateAssociationStatus } from '@/lib/api';

import InscriptionHeader from '@/components/admin/inscription/InscriptionHeader';
import InscriptionStructureCard from '@/components/admin/inscription/InscriptionStructureCard';
import InscriptionContactCard from '@/components/admin/inscription/InscriptionContactCard';
import InscriptionActionBar from '@/components/admin/inscription/InscriptionActionBar';

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
            href="/admin/inscription"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--Mosaic-Tile)] transition-opacity hover:opacity-80"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Retour aux demandes d’inscription</span>
          </Link>
        </nav>

        {/* ── État de chargement ───────────────────────────── */}
        {loading && (
          <article className="py-20 text-center text-[var(--muted)]">
            <svg className="mx-auto h-8 w-8 animate-spin text-[var(--Mosaic-Tile)]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider">Chargement de la demande...</p>
          </article>
        )}

        {/* ── Erreur ───────────────────────────────────────── */}
        {error && (
          <p className="mb-6 rounded-[10px] border-l-4 border-[var(--Flush-Mahogany)] bg-rose-50/70 p-4 text-xs font-semibold leading-5 text-[var(--Flush-Mahogany)]" role="alert">
            {error}
          </p>
        )}

        {/* ── Message de succès ────────────────────────────── */}
        {feedbackMessage && (
          <p className="mb-6 rounded-[10px] border-l-4 border-emerald-600 bg-emerald-50/80 p-4 text-xs font-semibold leading-5 text-emerald-800" role="status">
            {feedbackMessage}
          </p>
        )}

        {/* ── Contenu principal de la fiche ─────────────────── */}
        {!loading && association && (
          <article className="space-y-6">
            <InscriptionHeader
              association={association}
              formattedDate={formattedDate}
            />

            {/* Grille d'informations */}
            <section className="grid grid-cols-1 gap-6 md:grid-cols-2" aria-labelledby="heading-association-info">
              <h2 id="heading-association-info" className="sr-only">Informations détaillées de la demande</h2>

              <InscriptionStructureCard
                association={association}
                formattedDate={formattedDate}
              />

              <InscriptionContactCard
                contact={association.contact}
              />
            </section>

            {/* Actions de validation / refus */}
            <InscriptionActionBar
              status={association.statut}
              updating={updating}
              onUpdateStatus={handleUpdateStatus}
            />
          </article>
        )}
      </section>
    </AdminLayout>
  );
}
