'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  getAdminEquipmentReservation,
  updateAdminEquipmentReservationStatus,
  type AdminEquipmentReservation,
} from '@/lib/api';

function formatDate(value: string | null): string {
  if (!value) return 'Date non renseignée';
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function statusCode(status: AdminEquipmentReservation['statut']) {
  return status === 'En attente' ? 'PENDING_VALIDATION' : status === 'Validée' ? 'VALIDATED' : 'REFUSED';
}

export default function AdminEquipmentReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const reservationId = Number(params.id);
  const [reservation, setReservation] = useState<AdminEquipmentReservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [noteInterne, setNoteInterne] = useState('');
  const [pendingStatus, setPendingStatus] = useState<'Validée' | 'Refusée' | null>(null);

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

  return (
    <AdminLayout>
      <section className="mx-auto max-w-5xl">
        <nav aria-label="Retour aux demandes" className="mb-6">
          <Link href="/admin/materiel/demandes" className="text-xs font-bold uppercase tracking-label text-primary hover:underline">
            ← Retour aux demandes
          </Link>
        </nav>
        {loading && <p className="py-16 text-center text-xs font-bold uppercase tracking-label text-muted">Chargement de la demande...</p>}
        {error && <p className="mb-6 rounded-control border-l-4 border-danger bg-rose-50/70 p-4 text-xs font-semibold text-danger" role="alert">{error}</p>}
        {feedback && <p className="mb-6 rounded-control border-l-4 border-primary bg-primary-soft p-4 text-xs font-semibold text-primary" role="status">{feedback}</p>}
        {!loading && reservation && (
          <article className="space-y-6">
            <header className="border-b border-line pb-5">
              <p className="text-label font-bold uppercase tracking-kicker text-primary">Demande de réservation</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black uppercase tracking-heading text-ink sm:text-3xl">
                  {reservation.association.nom || 'Association non renseignée'}
                </h1>
                <StatusBadge status={statusCode(reservation.statut)} />
              </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
              <div className="space-y-6">
                <section className="rounded-control border border-line bg-paper p-5" aria-labelledby="association-heading">
                  <h2 id="association-heading" className="text-xs font-bold uppercase tracking-section text-ink">Identité de l’association</h2>
                  <div className="mt-4 border-t border-line pt-4">
                    <p className="text-label font-bold uppercase tracking-label text-muted">Nom de l’association</p>
                    <p className="mt-1 font-black uppercase text-ink">{reservation.association.nom || 'Non renseigné'}</p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <div><p className="text-label font-bold uppercase tracking-label text-muted">Représentant</p><p className="mt-1 text-sm font-semibold text-ink">{reservation.association.contact.prenom} {reservation.association.contact.nom}</p></div>
                      <div><p className="text-label font-bold uppercase tracking-label text-muted">E-mail</p><p className="mt-1 break-words text-sm text-ink">{reservation.association.contact.email || 'Non renseigné'}</p></div>
                      <div><p className="text-label font-bold uppercase tracking-label text-muted">Téléphone</p><p className="mt-1 text-sm text-ink">{reservation.association.contact.telephone || 'Non renseigné'}</p></div>
                    </div>
                  </div>
                </section>

                <section className="rounded-control border border-line bg-paper p-5" aria-labelledby="reservation-heading">
                  <h2 id="reservation-heading" className="text-xs font-bold uppercase tracking-section text-ink">Détails de la réservation</h2>
                  <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
                    <div><p className="text-label font-bold uppercase tracking-label text-muted">Retrait</p><p className="mt-1 text-sm font-semibold text-ink">{formatDate(reservation.dateRetrait)}</p></div>
                    <div><p className="text-label font-bold uppercase tracking-label text-muted">Restitution</p><p className="mt-1 text-sm font-semibold text-ink">{formatDate(reservation.dateRestitution)}</p></div>
                    <div className="sm:col-span-2"><p className="text-label font-bold uppercase tracking-label text-muted">Motif de l’événement</p><p className="mt-1 text-sm text-ink">{reservation.motifEvenement || 'Non renseigné'}</p></div>
                  </div>
                  <ul className="mt-5 space-y-2 border-t border-line pt-4">
                    {reservation.lignes.map((line) => (
                      <li key={line.materielId} className="flex items-center justify-between gap-4 rounded-soft bg-white p-3 text-sm">
                        <span className="font-semibold text-ink">{line.designation || 'Matériel supprimé'}</span>
                        <span className="font-bold text-primary">{line.quantite} unité{line.quantite !== 1 ? 's' : ''}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <aside className="h-fit rounded-control border border-line bg-white p-5" aria-labelledby="decision-heading">
                <h2 id="decision-heading" className="text-xs font-bold uppercase tracking-section text-ink">Décision</h2>
                <p className="mt-2 text-xs text-muted">La décision sera enregistrée dans le dossier de l’association.</p>
                <label htmlFor="internal-note" className="mt-5 block text-label font-bold uppercase tracking-label text-muted">
                  Note interne <span className="font-normal normal-case tracking-normal">(facultatif)</span>
                </label>
                <textarea
                  id="internal-note"
                  value={noteInterne}
                  onChange={(event) => setNoteInterne(event.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Ajouter une note interne (facultatif)"
                  className="mt-2 w-full resize-y rounded-control border border-line bg-paper p-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  disabled={reservation.statut !== 'En attente' || updating}
                />
                {reservation.statut === 'En attente' ? (
                  <div className="mt-5 grid gap-3">
                    <button type="button" onClick={() => setPendingStatus('Refusée')} className="h-11 rounded-control border border-danger px-4 text-xs font-bold uppercase tracking-label text-danger hover:bg-danger hover:text-white">Refuser</button>
                    <button type="button" onClick={() => setPendingStatus('Validée')} className="h-11 rounded-control bg-primary px-4 text-xs font-bold uppercase tracking-label text-white hover:bg-primary-hover">Accepter</button>
                  </div>
                ) : (
                  <div className="mt-5 rounded-soft bg-paper p-3 text-sm text-ink">
                    <p className="font-semibold">Cette demande a déjà été traitée.</p>
                    {reservation.noteInterne && <p className="mt-2 whitespace-pre-wrap text-muted">{reservation.noteInterne}</p>}
                  </div>
                )}
              </aside>
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
