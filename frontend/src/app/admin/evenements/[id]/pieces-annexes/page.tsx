'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/admin/Button';
import {
  AnnexesDocumentsHeading,
  AnnexesHeader,
  AnnexesNotice,
  AnnexesSharedHint,
  AnnexesSummary,
} from '@/components/annexes/AnnexesShared';
import {
  downloadExternalEventFile,
  getExternalEvent,
  requestExternalEventFiles,
  type ExternalEvent,
  type ExternalEventFile,
} from '@/lib/api';

function formatDate(value: string | null | undefined, withTime = false): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', withTime
    ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function AdminEventAnnexesPage() {
  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);
  const [event, setEvent] = useState<ExternalEvent | null>(null);
  const [missingFile, setMissingFile] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const loadEvent = useCallback(async () => {
    if (!Number.isInteger(eventId) || eventId <= 0) {
      setError('Identifiant d’événement invalide.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setEvent(await getExternalEvent(eventId));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible de charger l’événement.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadEvent(), 0);
    return () => window.clearTimeout(timer);
  }, [loadEvent]);

  async function handleRequestFiles(eventSubmit: React.FormEvent<HTMLFormElement>) {
    eventSubmit.preventDefault();
    const normalizedMissingFile = missingFile.trim();
    const normalizedMessage = message.trim();
    if (!event || !normalizedMissingFile || !normalizedMessage) {
      setError('Renseignez la pièce manquante et le message de relance.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setFeedback('');
      await requestExternalEventFiles(event.id, [normalizedMissingFile], normalizedMessage);
      setFeedback('La relance a été envoyée à l’association.');
      await loadEvent();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible d’envoyer la relance.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownload(file: ExternalEventFile) {
    try {
      setDownloadingId(file.id);
      setError('');
      await downloadExternalEventFile(file.id, file.original_name);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Impossible de télécharger le fichier.');
    } finally {
      setDownloadingId(null);
    }
  }

  const missingFiles = event?.missing_files ?? [];
  const files = event?.files ?? [];

  return (
    <AdminLayout>
      <section className="mx-auto max-w-5xl space-y-5">
        <nav aria-label="Fil d’Ariane" className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
          <Link href="/admin/evenements" className="text-primary hover:underline">Événements</Link>
          <span aria-hidden="true">/</span>
          <span>{event?.title ?? 'Dossier'}</span>
          <span aria-hidden="true">/</span>
          <span>Pièces annexes</span>
        </nav>

        <AnnexesHeader
          eyebrow="Suivi des demandes · Dossier partagé"
          description="Retrouvez les documents de la demande et partagez les demandes complémentaires avec l’association."
        />

        {loading && <p role="status" className="py-16 text-center text-xs font-bold uppercase tracking-label text-muted">Chargement du dossier...</p>}
        {error && <p role="alert" className="rounded-control border-l-4 border-danger bg-rose-50/70 p-4 text-xs font-semibold text-danger">{error}</p>}
        {feedback && <p role="status" className="rounded-control border-l-4 border-primary bg-primary-soft p-4 text-xs font-semibold text-primary">{feedback}</p>}

        {!loading && event && (
          <>
            <AnnexesSummary
              title={event.title}
              subtitle={`${event.event_type} · ${event.location}`}
              badge={missingFiles.length > 0 ? `${missingFiles.length} pièce manquante${missingFiles.length > 1 ? 's' : ''}` : 'Dossier complet'}
              items={[
                { label: 'Date', value: formatDate(event.start_date, true) },
                { label: 'Fin', value: formatDate(event.end_time, true) },
                { label: 'Association', value: event.association_name || 'Association non renseignée' },
              ]}
            />

            <AnnexesNotice
              title={event.documents_request_message ? 'Relance envoyée à l’association.' : files.length > 0 ? 'Un nouveau document est disponible dans le dossier partagé.' : 'Dossier partagé avec l’association.'}
              message={event.documents_request_message ? `Dernière relance le ${formatDate(event.documents_requested_at, true)} · ${event.documents_request_message}` : 'Les documents déposés sont consultables par les services municipaux.'}
            />

            <AnnexesSharedHint />

            <section className="space-y-3" aria-labelledby="documents-title">
              <div id="documents-title"><AnnexesDocumentsHeading count={files.length} /></div>
              {files.length === 0 ? (
                <p className="rounded-card border border-line bg-paper p-5 text-sm italic text-muted">Aucun document déposé.</p>
              ) : (
                <ul className="space-y-3">
                  {files.map((file) => (
                    <li key={file.id} className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-white p-4">
                      <div>
                        <p className="text-sm font-bold text-ink">{file.original_name}</p>
                        <p className="mt-1 text-xs text-muted">{formatFileSize(file.file_size)}</p>
                      </div>
                      <Button type="button" onClick={() => void handleDownload(file)} disabled={downloadingId === file.id}>
                        {downloadingId === file.id ? 'Téléchargement...' : 'Télécharger'}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-card border border-accent/50 bg-accent/10 p-6" aria-labelledby="missing-title">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id="missing-title" className="text-base font-black text-ink">Déclarer une pièce manquante</h2>
                  <p className="mt-1 text-sm text-muted">Une notification et un e-mail seront envoyés à l’association.</p>
                </div>
                {missingFiles.length > 0 && <span className="rounded-pill bg-accent px-3 py-1 text-xs font-bold text-ink">Pièce manquante</span>}
              </div>
              {missingFiles.length > 0 && (
                <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink">
                  {missingFiles.map((file) => <li key={file}>{file}</li>)}
                </ul>
              )}
              <form onSubmit={handleRequestFiles} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="missing-file" className="text-label font-bold uppercase tracking-label text-muted">Pièce attendue</label>
                  <input id="missing-file" value={missingFile} onChange={(inputEvent) => setMissingFile(inputEvent.target.value)} maxLength={255} placeholder="Ex. attestation d’assurance" className="mt-2 w-full rounded-control border border-line bg-white px-3 py-3 text-sm text-ink focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label htmlFor="request-message" className="text-label font-bold uppercase tracking-label text-muted">Message</label>
                  <textarea id="request-message" value={message} onChange={(inputEvent) => setMessage(inputEvent.target.value)} maxLength={2000} rows={5} placeholder="Précisez la pièce attendue et les informations utiles..." className="mt-2 w-full resize-y rounded-control border border-line bg-white px-3 py-3 text-sm text-ink focus:border-primary focus:outline-none" />
                </div>
                <Button type="submit" disabled={submitting}>{submitting ? 'Envoi en cours...' : missingFiles.length > 0 ? 'Relancer à nouveau' : 'Relancer l’association'}</Button>
              </form>
            </section>

            <section className="rounded-card border border-line bg-white p-5" aria-labelledby="history-title">
              <h2 id="history-title" className="text-xs font-bold uppercase tracking-section text-ink">Historique</h2>
              <div className="mt-4 border-t border-line pt-4">
                <p className="text-sm font-semibold text-ink">Déclaration reçue · Dossier partagé</p>
                <p className="mt-1 text-xs text-muted">{formatDate(event.created_at, true)} · Association #{event.asso_id}</p>
                <p className="mt-2 text-sm text-muted">Les pièces déposées par l’association sont disponibles dans cet espace.</p>
              </div>
              {event.documents_request_message && (
                <div className="mt-4 border-t border-line pt-4">
                  <p className="text-sm font-semibold text-ink">Relance envoyée · Mairie notifiée</p>
                  <p className="mt-1 text-xs text-muted">{formatDate(event.documents_requested_at, true)}</p>
                  <p className="mt-2 text-sm text-muted">{event.documents_request_message}</p>
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </AdminLayout>
  );
}
