'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import {
  AnnexesDocumentsHeading,
  AnnexesHeader,
  AnnexesNotice,
  AnnexesSharedHint,
  AnnexesSummary,
} from '@/components/annexes/AnnexesShared';
import {
  downloadAssociationEventFile,
  downloadPrivateDocument,
  getAssociationEventAnnexes,
  getAssociationRequestDetail,
  uploadAssociationRequestDocument,
  uploadAssociationEventFile,
  type AssociationRequestDetail,
  type EventAnnexFile,
  type RequestDocument,
} from '@/lib/api';

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatEventDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function formatEventTime(value: string | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value)).replace(':', ' h ');
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-soft border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
      {message}
    </p>
  );
}

function FileList({
  files,
  onDownload,
  downloadingFileId,
}: {
  files: EventAnnexFile[];
  onDownload: (file: EventAnnexFile) => void;
  downloadingFileId: number | null;
}) {
  if (files.length === 0) {
    return (
      <p className="rounded-card border border-line bg-paper p-5 text-sm italic text-muted">
        Aucune pièce annexe déposée pour le moment.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {files.map((file) => (
        <li key={file.id} className="rounded-card border border-line bg-white p-5">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-control bg-primary-soft text-label font-black uppercase text-primary">
              Fichier
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{file.originalName}</p>
              <p className="mt-1 text-xs text-muted">{file.fileType.toUpperCase()} · {formatFileSize(file.fileSize)} · Déposée le {formatDate(file.createdAt)}</p>
              <p className="mt-2 text-xs text-muted">Par votre association</p>
            </div>
            <span className="rounded-pill bg-primary-soft px-3 py-1 text-xs font-bold text-primary">Déposée</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
            <Button type="button" variant="secondary" size="sm" isLoading={downloadingFileId === file.id} onClick={() => onDownload(file)}>
              Télécharger
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function RequestAnnexesPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get('type') || 'evenement';
  const requestId = params.id;
  const eventId = Number(requestId.replace(/^event-/, ''));
  const isEvent = type === 'evenement' && Number.isInteger(eventId) && eventId > 0;
  const [detail, setDetail] = useState<AssociationRequestDetail | null>(null);
  const [files, setFiles] = useState<EventAnnexFile[]>([]);
  const [documents, setDocuments] = useState<RequestDocument[]>([]);
  const [missingFiles, setMissingFiles] = useState<string[]>([]);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadPage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isEvent) {
        const annexes = await getAssociationEventAnnexes(eventId);
        setDetail(annexes.event);
        setFiles(annexes.files);
        setMissingFiles(annexes.missingFiles);
        setRequestMessage(annexes.documentsRequestMessage);
      } else {
        const requestDetail = await getAssociationRequestDetail(requestId, type);
        setDetail(requestDetail);
        setDocuments(requestDetail.documents ?? []);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible de charger les pièces annexes.');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, isEvent, requestId, type]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPage();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPage]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setFeedback(null);
    try {
      if (isEvent) {
        const uploaded = await uploadAssociationEventFile(eventId, file);
        setFiles((current) => [
          {
            id: uploaded.id,
            originalName: uploaded.original_name,
            fileType: uploaded.file_type,
            mimeType: uploaded.mime_type,
            fileSize: uploaded.file_size,
            createdAt: new Date().toISOString(),
          },
          ...current,
        ]);
      } else if (type === 'materiel' || type === 'salle') {
        const uploaded = await uploadAssociationRequestDocument(requestId, type, file, file.name);
        setDocuments((current) => [uploaded, ...current]);
      }
      setFeedback('La pièce a été déposée avec succès.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Impossible de déposer cette pièce.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (file: EventAnnexFile) => {
    setDownloadingFileId(file.id);
    setError(null);
    try {
      const blob = await downloadAssociationEventFile(file.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.originalName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Impossible de télécharger cette pièce.');
    } finally {
      setDownloadingFileId(null);
    }
  };

  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-5">
        <nav aria-label="Fil d’Ariane" className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
          <button
            type="button"
            onClick={() => router.push(`/historique/${requestId}?type=${type}`)}
            className="text-primary hover:underline"
          >
            ← Historique
          </button>
          <span aria-hidden="true">/</span>
          <span>{detail?.id ?? 'Dossier'}</span>
          <span aria-hidden="true">/</span>
          <span>Pièces annexes</span>
        </nav>
        <AnnexesHeader
          eyebrow={`Espace associations · Suivi de votre ${isEvent ? 'événement' : 'dossier'}`}
          description="Retrouvez les documents de votre démarche et de la réservation liée."
        />

        {detail && (
          <AnnexesSummary
            title={detail.intitule}
            subtitle={`${detail.typeLabel} · ${detail.id}`}
            badge={isEvent && missingFiles.length > 0 ? `${missingFiles.length} pièce manquante${missingFiles.length > 1 ? 's' : ''}` : 'Dépôt ouvert'}
            items={isEvent
              ? [
                { label: 'Date de l’événement', value: `${formatEventDate(detail.keyDates.debut)} · ${formatEventTime(detail.keyDates.debut)} – ${formatEventTime(detail.keyDates.fin)}` },
                { label: 'Lieu', value: detail.location || 'Lieu non renseigné' },
                { label: 'Organisateur', value: 'Votre association' },
              ]
              : [
                { label: 'Déposé le', value: formatDate(detail.createdAt) },
                { label: 'Type', value: detail.typeLabel },
                { label: 'Association', value: 'Votre dossier' },
              ]}
          />
        )}

        {isLoading && <p role="status" className="py-12 text-center text-sm text-muted">Chargement des pièces…</p>}
        {!isLoading && error && <ErrorMessage message={error} />}
        {!isLoading && !error && (
          <>
            {requestMessage && (
              <AnnexesNotice
                title="Une pièce reste à fournir"
                message={`${requestMessage}\nDemande envoyée le ${formatDate(detail?.documentsRequestedAt)}`}
                tone="warning"
              />
            )}

            <AnnexesSharedHint>Documents partagés entre votre association et la mairie. Ajoutez les pièces possibles après la déclaration initiale.</AnnexesSharedHint>

            {isEvent ? (
              <>
                <section className="rounded-card border border-line bg-white p-5" aria-labelledby="upload-title">
                  <div className="flex items-center justify-between gap-4">
                    <h2 id="upload-title" className="text-base font-black tracking-title text-ink">Ajouter une pièce</h2>
                    <span className="text-xs text-muted">Dépôt toujours ouvert</span>
                  </div>
                  <div className="mt-4 grid gap-5 border-t border-line pt-4 lg:grid-cols-3">
                    <div>
                      <p className="text-label font-bold uppercase tracking-label text-muted">Type de pièce *</p>
                      <div className="mt-2 flex items-center justify-between rounded-control border border-line bg-paper px-3 py-3 text-sm font-semibold text-ink">
                        <span>{missingFiles[0] ?? 'Justificatif complémentaire'}</span>
                        <span aria-hidden="true" className="text-xl">+</span>
                      </div>
                      <p className="mt-2 text-xs text-muted">Sélectionnez la pièce attendue par la mairie.</p>
                    </div>
                    <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-control border border-dashed border-primary/40 bg-paper p-5 text-center hover:border-primary lg:col-span-2">
                      <span className="text-sm font-bold text-primary">
                        {isUploading ? 'Téléversement en cours…' : 'Déposez votre fichier ici'}
                      </span>
                      <span className="mt-1 text-xs text-primary underline">ou cliquez pour le sélectionner</span>
                      <span className="mt-2 text-xs text-muted">PDF, JPG ou PNG · 10 Mo maximum par fichier</span>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleUpload} disabled={isUploading} className="sr-only" />
                    </label>
                  </div>
                  <p className="mt-4 text-xs text-muted">Chaque pièce déposée est automatiquement partagée avec la mairie.</p>
                </section>
                {feedback && <p role="status" className="rounded-soft border border-primary/30 bg-primary-soft p-4 text-sm text-primary">{feedback}</p>}
                <section aria-labelledby="uploaded-files-title" className="space-y-3">
                  <AnnexesDocumentsHeading count={files.length}>Documents du dossier</AnnexesDocumentsHeading>
                  <FileList files={files} onDownload={handleDownload} downloadingFileId={downloadingFileId} />
                  {missingFiles.map((missingFile) => (
                    <article key={missingFile} className="rounded-card border border-accent bg-white p-5">
                      <div className="flex flex-wrap items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-danger/10 text-lg text-danger" aria-hidden="true">⌑</div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-ink">{missingFile}</h3>
                          <p className="mt-1 text-xs text-muted">Aucun fichier déposé · Pièce attendue pour compléter votre dossier.</p>
                        </div>
                        <span className="rounded-pill bg-danger/10 px-3 py-1 text-xs font-bold text-danger">Manquante</span>
                      </div>
                      <p className="mt-4 text-xs text-muted">Sélectionnez ce type de pièce dans la zone de dépôt pour compléter votre dossier.</p>
                    </article>
                  ))}
                </section>
              </>
            ) : (
              <section aria-labelledby="existing-documents-title" className="space-y-3">
                <h2 id="existing-documents-title" className="text-base font-bold tracking-title text-ink">Documents du dossier</h2>
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-soft border border-dashed border-primary/40 bg-paper p-4 hover:border-primary">
                  <span className="text-sm font-semibold text-ink">
                    {isUploading ? 'Téléversement en cours…' : 'Déposer un justificatif'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleUpload}
                    disabled={isUploading}
                    className="sr-only"
                  />
                  <span className="rounded-control bg-primary px-4 py-2 text-xs font-bold uppercase tracking-label text-white">
                    Parcourir
                  </span>
                </label>
                {feedback && <p role="status" className="rounded-soft border border-primary/30 bg-primary-soft p-4 text-sm text-primary">{feedback}</p>}
                {documents.length === 0 ? (
                  <p className="rounded-soft border border-line bg-paper p-4 text-sm italic text-muted">Aucune pièce justificative associée à ce dossier.</p>
                ) : (
                  <ul className="space-y-3">
                    {documents.map((document) => (
                      <li key={document.id} className="rounded-card border border-line bg-white p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-ink">{document.typeDocument}</p>
                            <p className="mt-1 text-xs text-muted">{document.description || 'Pièce justificative déposée par votre association.'}</p>
                          </div>
                          <span className="rounded-pill bg-primary-soft px-3 py-1 text-xs font-bold text-primary">Déposée</span>
                        </div>
                        {document.fichierUrl && (
                          <button
                            type="button"
                            onClick={() => downloadPrivateDocument(document.fichierUrl, document.typeDocument)}
                            className="mt-4 inline-flex text-xs font-bold uppercase tracking-label text-primary hover:text-primary-hover"
                          >
                            Télécharger le document
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {missingFiles.map((missingFile) => (
                  <article key={missingFile} className="rounded-card border border-accent bg-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-ink">{missingFile}</h3>
                        <p className="mt-1 text-xs text-muted">Pièce attendue pour compléter votre dossier.</p>
                      </div>
                      <span className="rounded-pill bg-danger/10 px-3 py-1 text-xs font-bold text-danger">Manquante</span>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
