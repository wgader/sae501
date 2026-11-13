'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  cancelAssociationRequest,
  getAssociationRequestDetail,
  getMediaUrl,
  type AssociationRequestDetail,
} from '@/lib/api';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Button from '@/components/ui/Button';
import RequestStatusBadge from './RequestStatusBadge';
import RequestTypeBadge from './RequestTypeBadge';

function formatDate(value: string | undefined | null, withTime = false): string {
  if (!value) return '—';

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(value));
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" role="status">
      <div className="h-8 w-8 animate-spin rounded-pill border-2 border-primary border-t-transparent" />
      <p className="mt-4 text-xs font-bold uppercase tracking-label text-muted">
        Chargement du dossier…
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-soft border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
      <p className="font-bold">Impossible de charger le dossier</p>
      <p className="mt-1">{message}</p>
    </div>
  );
}

function KeyDate({ label, value, tone = 'default' }: { label: string; value: string | undefined | null; tone?: 'default' | 'success' | 'danger' }) {
  const toneClass = tone === 'success'
    ? 'border-primary/20 bg-primary-soft'
    : tone === 'danger'
      ? 'border-danger/20 bg-danger/10'
      : 'border-line bg-white';

  return (
    <div className={`rounded-soft border p-4 ${toneClass}`}>
      <span className="block text-caption font-bold uppercase tracking-label text-muted">{label}</span>
      <time className="mt-1 block text-sm font-bold text-ink" dateTime={value ?? undefined}>
        {formatDate(value, true)}
      </time>
    </div>
  );
}

function RequestInformation({ detail }: { detail: AssociationRequestDetail }) {
  if (detail.type === 'subvention') {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoField label="Type de subvention" value={detail.typeSubvention} />
        <InfoField
          label="Montant demandé"
          value={detail.montantDemande !== undefined ? `${detail.montantDemande.toLocaleString('fr-FR')} €` : undefined}
        />
        <InfoField label="Exercice budgétaire" value={detail.anneeExercice?.toString()} />
        <InfoField label="Description" value={detail.description} />
      </div>
    );
  }

  if (detail.type === 'materiel') {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoField label="Date de retrait" value={formatDate(detail.keyDates.retrait, true)} />
          <InfoField label="Date de restitution" value={formatDate(detail.keyDates.restitution, true)} />
        </div>
        <ul className="divide-y divide-line overflow-hidden rounded-soft border border-line bg-white">
          {(detail.lignes ?? []).map((line) => (
            <li key={`${line.materielId}-${line.designation}`} className="flex items-center justify-between gap-4 p-4 text-sm">
              <span className="font-semibold text-ink">{line.designation}</span>
              <span className="text-muted">Quantité : {line.quantite}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (detail.type === 'evenement') {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoField label="Type d’événement" value={detail.eventType} />
        <InfoField label="Lieu" value={detail.location} />
        <InfoField label="Début" value={formatDate(detail.keyDates.debut, true)} />
        <InfoField label="Fin" value={formatDate(detail.keyDates.fin, true)} />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <InfoField label="Salle demandée" value={detail.salleNom} />
      <InfoField label="Adresse" value={detail.salleAdresse} />
      <InfoField label="Début du créneau" value={formatDate(detail.keyDates.debut)} />
      <InfoField label="Fin du créneau" value={formatDate(detail.keyDates.fin)} />
      <InfoField label="Participants attendus" value={detail.capaciteAttendue?.toString()} />
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="block text-caption font-bold uppercase tracking-label text-muted">{label}</span>
      <p className="mt-1 rounded-soft bg-paper p-3 text-sm text-ink">{value || '—'}</p>
    </div>
  );
}

function Documents({ documents }: Pick<AssociationRequestDetail, 'documents'>) {
  const requestDocuments = documents ?? [];

  return (
    <section aria-labelledby="documents-title" className="space-y-3">
      <h2 id="documents-title" className="text-xs font-bold uppercase tracking-label text-muted">
        Informations transmises
      </h2>
      {requestDocuments.length === 0 ? (
        <p className="rounded-soft border border-line bg-paper p-4 text-sm italic text-muted">
          Aucune pièce justificative déposée pour cette démarche.
        </p>
      ) : (
        <ul className="space-y-2">
          {requestDocuments.map((document) => (
            <li key={document.id} className="flex items-center justify-between gap-4 rounded-soft border border-line bg-white p-3">
              <span className="truncate text-sm font-semibold text-ink">{document.typeDocument}</span>
              {document.fichierUrl && (
                <a
                  href={getMediaUrl(document.fichierUrl) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs font-bold uppercase tracking-label text-primary hover:text-primary-hover"
                >
                  Consulter
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id;
  const type = searchParams.get('type') || undefined;
  const [detail, setDetail] = useState<AssociationRequestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadDetail = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setDetail(await getAssociationRequestDetail(id, type));
    } catch (requestError) {
      console.error(requestError);
      setError(requestError instanceof Error ? requestError.message : 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  }, [id, type]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDetail();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDetail]);

  const canCancel = useMemo(
    () =>
      detail !== null &&
      (detail.type === 'materiel' || detail.type === 'salle') &&
      detail.statut !== null &&
      detail.statut !== undefined &&
      ['En attente', 'En cours de traitement', 'Validée'].includes(detail.statut),
    [detail],
  );

  const handleCancel = async () => {
    if (!detail || (detail.type !== 'materiel' && detail.type !== 'salle')) return;
    setIsCancelling(true);
    try {
      await cancelAssociationRequest(detail.id, detail.type);
      setIsCancelOpen(false);
      await loadDetail();
    } catch (requestError) {
      console.error(requestError);
      setError(requestError instanceof Error ? requestError.message : 'Impossible d’annuler la réservation.');
      setIsCancelOpen(false);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-328 space-y-8">
        <header className="space-y-4">
          <button type="button" onClick={() => router.push('/historique')} className="text-xs font-bold uppercase tracking-label text-ink hover:text-primary">
            ← Retour à l’historique
          </button>
          <div>
            <p className="text-label font-bold uppercase tracking-eyebrow text-primary">Historique des demandes</p>
            <h1 className="mt-2 text-4xl font-black tracking-display text-ink">Détail de la demande</h1>
            <p className="mt-2 text-sm text-muted">Retrouvez les informations transmises et suivez le traitement de votre demande.</p>
          </div>
        </header>

        {isLoading && <LoadingState />}
        {!isLoading && error && <ErrorState message={error} />}
        {!isLoading && !error && detail && (
          <>
            <section className="flex flex-col justify-between gap-4 rounded-soft border border-line bg-white p-5 shadow-card sm:flex-row sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <RequestTypeBadge requestType={detail.type} label={detail.typeLabel} />
                  <span className="text-xs text-muted">Demande n° {detail.id}</span>
                </div>
                <h2 className="mt-2 text-lg font-bold uppercase text-ink">{detail.intitule}</h2>
              </div>
              {detail.type !== 'evenement' && detail.statut && (
                <RequestStatusBadge statusLabel={detail.statut} size="md" />
              )}
            </section>

            {detail.type !== 'subvention' && (
              <Button
                type="button"
                size="md"
                className="self-end sm:self-start"
                rightIcon={
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="m15.5 6.5-6.7 6.7a3 3 0 0 0 4.2 4.2l6-6a4.5 4.5 0 0 0-6.4-6.4l-6.7 6.7a6 6 0 1 0 8.5 8.5l5.2-5.2" />
                  </svg>
                }
                onClick={() => router.push(`/historique/${detail.id}/pieces-annexes?type=${detail.type}`)}
              >
                Pièces annexes
              </Button>
            )}

            <section aria-labelledby="dates-title" className="grid gap-3 sm:grid-cols-2">
              <h2 id="dates-title" className="sr-only">Dates clés de la demande</h2>
              <KeyDate label="Soumise le" value={detail.keyDates.depot || detail.createdAt} />
              {detail.keyDates.decision && (
                <KeyDate
                  label={detail.statut === 'Refusée' ? 'Refusée le' : detail.statut === 'Annulée' ? 'Annulée le' : 'Décision le'}
                  value={detail.keyDates.decision}
                  tone={detail.statut === 'Refusée' ? 'danger' : 'success'}
                />
              )}
            </section>

            <section aria-labelledby="information-title" className="space-y-4 rounded-soft border border-line bg-white p-5">
              <h2 id="information-title" className="text-base font-bold tracking-title text-ink">Informations soumises</h2>
              <RequestInformation detail={detail} />
            </section>

            {(detail.statut === 'Refusée' || detail.decisionMotif || detail.observations) && (
              <section className="rounded-soft border border-danger/20 bg-danger/10 p-4" aria-labelledby="decision-title">
                <h2 id="decision-title" className="text-xs font-bold uppercase tracking-label text-danger">
                  {detail.statut === 'Refusée' ? 'Motif communiqué par la mairie' : 'Observation de la commune'}
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">
                  {detail.decisionMotif || detail.observations || 'Aucun motif de refus n’a été communiqué.'}
                </p>
              </section>
            )}

            <div id="documents">
              <Documents documents={detail.documents} />
            </div>

            {canCancel && (
              <section className="flex flex-col justify-between gap-4 rounded-soft border border-danger/20 bg-white p-5 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-bold text-ink">Vous n’avez plus besoin de cette réservation ?</h2>
                  <p className="mt-1 text-sm text-muted">Annulez-la pour libérer le matériel ou le créneau.</p>
                </div>
                <button type="button" onClick={() => setIsCancelOpen(true)} className="inline-flex h-11 items-center justify-center rounded-soft bg-danger px-5 text-xs font-bold uppercase tracking-label text-white hover:bg-danger/90">
                  Annuler la réservation
                </button>
              </section>
            )}
          </>
        )}
      </div>

      <ConfirmationModal
        isOpen={isCancelOpen}
        title="Annuler la réservation ?"
        description="Cette action conservera le dossier dans votre historique et libérera la réservation."
        confirmLabel="Confirmer l’annulation"
        confirmVariant="danger"
        isLoading={isCancelling}
        onConfirm={handleCancel}
        onClose={() => setIsCancelOpen(false)}
      />
    </main>
  );
}
