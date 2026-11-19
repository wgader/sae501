'use client';

import Link from 'next/link';
import { useQueryId } from '@/hooks/useQueryParam';
import { Suspense, useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import EquipmentRequestAssociationCard from '@/components/admin/equipment/request/EquipmentRequestAssociationCard';
import EquipmentRequestDecisionCard from '@/components/admin/equipment/request/EquipmentRequestDecisionCard';
import EquipmentRequestDetailsCard from '@/components/admin/equipment/request/EquipmentRequestDetailsCard';
import EquipmentRequestDocumentsCard from '@/components/admin/equipment/request/EquipmentRequestDocumentsCard';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Notice from '@/components/ui/Notice';
import StatusBadge from '@/components/ui/StatusBadge';
import { IconArrowLeft } from '@/components/ui/icons';
import {
  getAdminEquipmentReservation,
  requestAdminAssociationDocuments,
  updateAdminEquipmentReservationStatus,
  type AdminEquipmentReservation,
} from '@/lib/api';

function statusCode(status: AdminEquipmentReservation['statut']) {
  return status === 'En attente'
    ? 'PENDING_VALIDATION'
    : status === 'Validée'
      ? 'VALIDATED'
      : status === 'Refusée'
        ? 'REFUSED'
        : 'PENDING_VALIDATION';
}

function AdminEquipmentReservationDetailPageContent() {
  const reservationId = useQueryId();
  const [reservation, setReservation] = useState<AdminEquipmentReservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [noteInterne, setNoteInterne] = useState('');
  const [pendingStatus, setPendingStatus] = useState<'Validée' | 'Refusée' | null>(null);
  const [requestingDocuments, setRequestingDocuments] = useState(false);

  const loadReservation = useCallback(async () => {
    if (!Number.isInteger(reservationId) || reservationId <= 0) {
      setError('Identifiant de réservation invalide.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      setReservation(await getAdminEquipmentReservation(reservationId));
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible de charger la demande.');
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReservation(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReservation]);

  async function handleStatusUpdate() {
    if (!reservation || !pendingStatus) return;
    try {
      setUpdating(true);
      const updated = await updateAdminEquipmentReservationStatus(
        reservation.id ?? 0,
        pendingStatus,
        noteInterne,
      );
      setReservation(updated);
      setFeedback(pendingStatus === 'Validée' ? 'La demande a été acceptée.' : 'La demande a été refusée.');
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible de mettre à jour la demande.');
    } finally {
      setUpdating(false);
      setPendingStatus(null);
    }
  }

  async function handleRequestDocuments(missingFile: string, message: string): Promise<boolean> {
    if (!reservation?.association.id || !reservation.id) return false;

    try {
      setRequestingDocuments(true);
      setError('');
      await requestAdminAssociationDocuments(reservation.association.id, String(reservation.id), 'materiel', [missingFile], message);
      await loadReservation();
      setFeedback('La demande de pièces a été envoyée à l’association.');
      return true;
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible d’envoyer la demande de pièces.');
      return false;
    } finally {
      setRequestingDocuments(false);
    }
  }

  return (
    <AdminLayout>
      <section className="mx-auto max-w-328 space-y-8">
        <Link
          href="/admin/materiel/demandes"
          className="inline-flex items-center gap-1.5 text-meta font-bold uppercase tracking-label text-muted transition-colors hover:text-ink"
        >
          <IconArrowLeft />
          Retour aux demandes
        </Link>

        {loading && !reservation && (
          <p role="status" className="py-16 text-center text-body-sm text-muted">
            Chargement de la demande…
          </p>
        )}
        {error && <Notice tone="danger">{error}</Notice>}
        {feedback && <Notice tone="success">{feedback}</Notice>}

        {reservation && (
          <article className="space-y-8">
            <header className="border-b border-line pb-6">
              <p className="text-label font-bold uppercase tracking-kicker text-primary">Demande de réservation</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black uppercase tracking-wider text-ink sm:text-3xl">
                  {reservation.association.nom || 'Association non renseignée'}
                </h1>
                <StatusBadge status={statusCode(reservation.statut)} />
              </div>
            </header>

            <div className="grid items-start gap-8 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-8">
                <EquipmentRequestAssociationCard association={reservation.association} />
                <EquipmentRequestDetailsCard reservation={reservation} />
                <EquipmentRequestDocumentsCard reservation={reservation} isSending={requestingDocuments} onRequest={handleRequestDocuments} />
              </div>
              <EquipmentRequestDecisionCard
                reservation={reservation}
                note={noteInterne}
                isUpdating={updating}
                onNoteChange={setNoteInterne}
                onDecide={setPendingStatus}
              />
            </div>
          </article>
        )}
        {pendingStatus && reservation && (
          <ConfirmationModal
            isOpen
            associationName={reservation.association.nom ?? undefined}
            currentStatus={statusCode(reservation.statut)}
            targetStatus={statusCode(pendingStatus)}
            confirmVariant={pendingStatus === 'Refusée' ? 'danger' : 'primary'}
            isLoading={updating}
            onConfirm={handleStatusUpdate}
            onClose={() => { if (!updating) setPendingStatus(null); }}
          />
        )}
      </section>
    </AdminLayout>
  );
}

// Lit l'identifiant dans la query string : l'export statique exige une frontière <Suspense>.
export default function AdminEquipmentReservationDetailPage() {
  return (
    <Suspense>
      <AdminEquipmentReservationDetailPageContent />
    </Suspense>
  );
}
