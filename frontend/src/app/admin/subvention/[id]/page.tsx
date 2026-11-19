'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import GrantAssociationCard from '@/components/admin/grant/GrantAssociationCard';
import GrantDecisionCard from '@/components/admin/grant/GrantDecisionCard';
import GrantDocumentsCard from '@/components/admin/grant/GrantDocumentsCard';
import GrantProjectCard from '@/components/admin/grant/GrantProjectCard';
import GrantStatusBadge from '@/components/subventions/GrantStatusBadge';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Notice from '@/components/ui/Notice';
import { IconArrowLeft } from '@/components/ui/icons';
import { decideAdminGrant, getAdminGrant, type AdminGrantDetail } from '@/lib/api';
import { grantStatusBadge } from '@/lib/grantApplication';

type Decision = 'Validée' | 'Refusée';

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

export default function AdminGrantDetailPage() {
  const params = useParams<{ id: string }>();
  const grantId = Number(params.id);
  const [grant, setGrant] = useState<AdminGrantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [pendingDecision, setPendingDecision] = useState<Decision | null>(null);

  useEffect(() => {
    let active = true;
    if (!Number.isInteger(grantId) || grantId <= 0) {
      queueMicrotask(() => {
        setError('Identifiant de demande invalide.');
        setLoading(false);
      });
      return;
    }
    getAdminGrant(grantId)
      .then((result) => {
        if (!active) return;
        setGrant(result);
        setAmount(result.montantDemande.replace('.', ','));
      })
      .catch((requestError: unknown) => {
        if (active) setError(errorMessage(requestError, 'Impossible de charger la demande.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [grantId]);

  async function confirmDecision() {
    if (!grant || !pendingDecision) return;
    setUpdating(true);
    setError('');
    try {
      const updated = await decideAdminGrant(grant.id, {
        status: pendingDecision,
        montantAccorde: pendingDecision === 'Validée' ? amount : undefined,
        message,
      });
      setGrant(updated);
      setFeedback(pendingDecision === 'Validée' ? 'La subvention a été accordée.' : 'La demande a été refusée.');
    } catch (requestError: unknown) {
      setError(errorMessage(requestError, 'Impossible d’enregistrer la décision.'));
    } finally {
      setUpdating(false);
      setPendingDecision(null);
    }
  }

  return (
    <AdminLayout>
      <section className="mx-auto max-w-328 space-y-8">
        <Link
          href="/admin/subvention"
          className="inline-flex items-center gap-1.5 text-meta font-bold uppercase tracking-label text-muted transition-colors hover:text-ink"
        >
          <IconArrowLeft />
          Retour aux demandes
        </Link>

        {loading && <p role="status" className="py-16 text-center text-body-sm text-muted">Chargement de la demande…</p>}
        {error && <Notice tone="danger">{error}</Notice>}
        {feedback && <Notice tone="success">{feedback}</Notice>}

        {grant && (
          <article className="space-y-8">
            <header className="border-b border-line pb-6">
              <p className="text-label font-bold uppercase tracking-kicker text-primary">Demande de subvention</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black uppercase tracking-wider text-ink sm:text-3xl">
                  {grant.association.nom || 'Association non renseignée'}
                </h1>
                <GrantStatusBadge status={grant.statut} />
              </div>
            </header>

            <div className="grid items-start gap-8 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-8">
                <GrantProjectCard grant={grant} />
                <GrantAssociationCard grant={grant} />
                <GrantDocumentsCard documents={grant.documents} />
              </div>
              <GrantDecisionCard
                grant={grant}
                amount={amount}
                message={message}
                isUpdating={updating}
                onAmountChange={setAmount}
                onMessageChange={setMessage}
                onDecide={setPendingDecision}
              />
            </div>
          </article>
        )}

        {pendingDecision && grant && (
          <ConfirmationModal
            isOpen
            title={pendingDecision === 'Validée' ? 'Accorder la subvention' : 'Refuser la demande'}
            description={
              pendingDecision === 'Validée'
                ? `Montant accordé : ${amount || grant.montantDemande} €. L’association sera prévenue par e-mail.`
                : 'L’association recevra le motif du refus par e-mail.'
            }
            associationName={grant.association.nom ?? undefined}
            currentStatus={grantStatusBadge(grant.statut).code}
            targetStatus={pendingDecision === 'Validée' ? 'VALIDATED' : 'REFUSED'}
            confirmVariant={pendingDecision === 'Refusée' ? 'danger' : 'primary'}
            isLoading={updating}
            onConfirm={confirmDecision}
            onClose={() => {
              if (!updating) setPendingDecision(null);
            }}
          />
        )}
      </section>
    </AdminLayout>
  );
}
