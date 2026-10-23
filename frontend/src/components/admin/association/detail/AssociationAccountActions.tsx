'use client';

import { useState } from 'react';
import { type AssociationStatus } from '@/lib/api';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface AssociationAccountActionsProps {
  nom: string;
  statut: AssociationStatus;
  onSuspend: () => Promise<void>;
  onDelete: () => Promise<void>;
  disabled?: boolean;
}

export default function AssociationAccountActions({
  nom,
  statut,
  onSuspend,
  onDelete,
  disabled = false,
}: AssociationAccountActionsProps) {
  const [modalType, setModalType] = useState<'SUSPEND' | 'DELETE' | null>(null);
  const [loading, setLoading] = useState(false);

  const isSuspended = statut === 'SUSPENDED';

  const handleConfirmAction = async () => {
    setLoading(true);
    try {
      if (modalType === 'SUSPEND') {
        await onSuspend();
      } else if (modalType === 'DELETE') {
        await onDelete();
      }
      setModalType(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4 pt-2">
      <h3 className="text-sm font-bold text-danger">
        Gestion du compte
      </h3>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setModalType('DELETE')}
          disabled={disabled}
          className="rounded-control bg-danger px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-danger/90 disabled:opacity-50 cursor-pointer"
        >
          Supprimer le compte
        </button>

        <button
          type="button"
          onClick={() => setModalType('SUSPEND')}
          disabled={disabled}
          className="rounded-control border border-danger bg-transparent px-5 py-2.5 text-xs font-bold text-danger transition-colors hover:bg-danger/10 disabled:opacity-50 cursor-pointer"
        >
          {isSuspended ? 'Réactiver le compte' : 'Suspendre le compte'}
        </button>
      </div>

      <p className="border-t border-line pt-4 text-xs text-muted">
        Les informations non communiquées par l’association sont indiquées « Non renseigné ».
      </p>

      {modalType === 'DELETE' && (
        <ConfirmationModal
          isOpen={true}
          title="Supprimer définitivement l’association ?"
          description={`Êtes-vous sûr de vouloir supprimer l’association « ${nom} » ? Cette action est irréversible et supprimera l’ensemble de ses comptes et données associées.`}
          confirmLabel="Supprimer définitivement"
          cancelLabel="Annuler"
          confirmVariant="danger"
          isLoading={loading}
          onConfirm={handleConfirmAction}
          onClose={() => setModalType(null)}
        />
      )}

      {modalType === 'SUSPEND' && (
        <ConfirmationModal
          isOpen={true}
          title={isSuspended ? 'Réactiver le compte de l’association ?' : 'Suspendre le compte de l’association ?'}
          description={
            isSuspended
              ? `L’association « ${nom} » pourra de nouveau accéder à ses démarches et services municipaux.`
              : `L’association « ${nom} » sera temporairement suspendue et ses accès aux modules municipaux seront bloqués.`
          }
          confirmLabel={isSuspended ? 'Réactiver' : 'Suspendre'}
          cancelLabel="Annuler"
          confirmVariant={isSuspended ? 'primary' : 'danger'}
          isLoading={loading}
          onConfirm={handleConfirmAction}
          onClose={() => setModalType(null)}
        />
      )}
    </section>
  );
}
