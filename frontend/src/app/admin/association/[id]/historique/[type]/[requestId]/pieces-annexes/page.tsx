'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AnnexesDocumentsHeading,
  AnnexesHeader,
  AnnexesSharedHint,
  AnnexesSummary,
} from '@/components/annexes/AnnexesShared';
import { useEffect, useState } from 'react';
import {
  getAdminAssociationRequestDetail,
  getMediaUrl,
  requestAdminAssociationDocuments,
  type AssociationRequestDetail,
  type RequestType,
} from '@/lib/api';

export default function AdminAssociationRequestAnnexesPage() {
  const params = useParams<{ id: string; type: string; requestId: string }>();
  const associationId = Number(params.id);
  const type = params.type as RequestType;
  const [detail, setDetail] = useState<AssociationRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [missingFile, setMissingFile] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    let active = true;
    void getAdminAssociationRequestDetail(associationId, params.requestId, type)
      .then((response) => {
        if (active) setDetail(response);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Impossible de charger le dossier.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [associationId, params.requestId, type]);

  const documents = detail?.documents ?? [];
  const canRequestDocuments = (type === 'materiel' || type === 'salle')
    && ['En attente', 'En cours de traitement', 'Complément requis', 'Validée'].includes(detail?.statut ?? '');

  async function handleRequestDocuments(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (type !== 'materiel' && type !== 'salle') return;
    const normalizedMissingFile = missingFile.trim();
    const normalizedMessage = message.trim();
    if (!normalizedMissingFile || !normalizedMessage) {
      setError('Renseignez la pièce manquante et le message de relance.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setFeedback('');
      const response = await requestAdminAssociationDocuments(
        associationId,
        params.requestId,
        type,
        [normalizedMissingFile],
        normalizedMessage,
      );
      setDetail(response.detail);
      setMissingFile('');
      setMessage('');
      setFeedback('La demande de pièces a été envoyée à l’association.');
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible d’envoyer la demande de pièces.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-5" aria-labelledby="annexes-title">
      <nav aria-label="Fil d’Ariane" className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
        <Link href={`/admin/association/${associationId}/historique`} className="text-primary hover:underline">Historique</Link>
        <span aria-hidden="true">/</span>
        <span>{detail?.typeLabel ?? 'Dossier'}</span>
        <span aria-hidden="true">/</span>
        <span>Pièces annexes</span>
      </nav>
      <AnnexesHeader
        eyebrow="Suivi des demandes · Dossier partagé"
        description="Retrouvez les documents de la demande et partagez les demandes complémentaires avec l’association."
      />
      {loading && <p className="rounded-card border border-line bg-white p-6 text-sm text-muted" role="status">Chargement des documents...</p>}
      {error && <p className="rounded-card border-l-4 border-danger bg-rose-50/70 p-4 text-sm font-semibold text-danger" role="alert">{error}</p>}
      {feedback && <p className="rounded-card border-l-4 border-primary bg-primary-soft p-4 text-sm font-semibold text-primary" role="status">{feedback}</p>}
      {!loading && !error && (
        <>
          <AnnexesSummary
            title={detail?.intitule ?? 'Dossier'}
            subtitle={`${detail?.typeLabel ?? type} · Dossier ${detail?.id ?? params.requestId}`}
            badge={`${documents.length} document${documents.length > 1 ? 's' : ''}`}
            items={[
              { label: 'Déposé le', value: detail?.createdAt ? new Date(detail.createdAt).toLocaleDateString('fr-FR') : '—' },
              { label: 'Association', value: `Association #${associationId}` },
              { label: 'Statut', value: detail?.statut ?? '—' },
            ]}
          />
          <AnnexesSharedHint />
          <section className="rounded-card border border-line bg-white p-5" aria-labelledby="documents-title">
            <div className="flex items-center justify-between gap-4">
              <AnnexesDocumentsHeading count={documents.length}>Documents déposés</AnnexesDocumentsHeading>
            </div>
            {documents.length === 0 ? (
              <p className="mt-4 border-t border-line pt-4 text-sm italic text-muted">Aucun document déposé.</p>
            ) : (
              <ul className="mt-4 space-y-2 border-t border-line pt-4">
                {documents.map((document) => {
                  const url = getMediaUrl(document.fichierUrl);
                  return (
                    <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-soft bg-paper p-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">{document.typeDocument}</p>
                        <p className="mt-1 text-xs text-muted">{document.createdAt ? new Date(document.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}</p>
                      </div>
                      {url && <a href={url} target="_blank" rel="noreferrer" className="text-xs font-bold uppercase tracking-label text-primary hover:underline">Consulter</a>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          {canRequestDocuments && (
            <section className="rounded-card border border-accent/50 bg-accent/10 p-5" aria-labelledby="request-documents-title">
              <h3 id="request-documents-title" className="text-xs font-bold uppercase tracking-section text-ink">Demander une pièce manquante</h3>
              <form className="mt-4 space-y-4 border-t border-line pt-4" onSubmit={(event) => void handleRequestDocuments(event)}>
                <div>
                  <label htmlFor="missing-file" className="text-label font-bold uppercase tracking-label text-muted">Pièce manquante</label>
                  <input id="missing-file" value={missingFile} onChange={(event) => setMissingFile(event.target.value)} className="mt-1 w-full rounded-control border border-line bg-paper px-3 py-2 text-sm text-ink" placeholder="Ex. attestation d’assurance" />
                </div>
                <div>
                  <label htmlFor="request-message" className="text-label font-bold uppercase tracking-label text-muted">Message à l’association</label>
                  <textarea id="request-message" value={message} onChange={(event) => setMessage(event.target.value)} rows={4} className="mt-1 w-full rounded-control border border-line bg-paper px-3 py-2 text-sm text-ink" placeholder="Précisez les éléments attendus..." />
                </div>
                <button type="submit" disabled={submitting} className="rounded-control bg-primary px-4 py-2 text-xs font-bold uppercase tracking-label text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
                  {submitting ? 'Envoi...' : 'Envoyer la demande'}
                </button>
              </form>
            </section>
          )}
          <section className="rounded-card border border-line bg-white p-5" aria-labelledby="history-title">
            <h3 id="history-title" className="text-xs font-bold uppercase tracking-section text-ink">Historique</h3>
            <div className="mt-4 border-t border-line pt-4">
              <p className="text-sm font-semibold text-ink">Dossier reçu · Dossier partagé</p>
              <p className="mt-1 text-xs text-muted">{detail?.createdAt ? new Date(detail.createdAt).toLocaleString('fr-FR') : 'Date inconnue'} · Association #{associationId}</p>
              <p className="mt-2 text-sm text-muted">Les pièces déposées par l’association sont disponibles dans cet espace.</p>
            </div>
            {detail?.observations && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="text-sm font-semibold text-ink">Relance envoyée · Mairie notifiée</p>
                <p className="mt-2 whitespace-pre-line text-sm text-muted">{detail.observations}</p>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}
