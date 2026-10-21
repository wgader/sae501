import { type AssociationStatus } from '@/lib/api';
import Button from '@/components/ui/Button';

interface InscriptionActionBarProps {
  status: AssociationStatus;
  updating: boolean;
  onUpdateStatus: (status: AssociationStatus) => void;
}

export default function InscriptionActionBar({
  status,
  updating,
  onUpdateStatus,
}: InscriptionActionBarProps) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8">
      <span className="text-xs text-[var(--muted)]">
        {status === 'PENDING_VALIDATION'
          ? 'Une décision d’acceptation déclenche l’envoi du lien d’activation à l’association.'
          : status === 'VALIDATED'
          ? 'Le compte associatif est validé et actif.'
          : 'Cette demande a été rejetée.'}
      </span>

      <span className="flex flex-wrap items-center gap-3">
        {status === 'PENDING_VALIDATION' && (
          <>
            <Button
              variant="danger"
              disabled={updating}
              onClick={() => onUpdateStatus('REFUSED')}
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
              onClick={() => onUpdateStatus('VALIDATED')}
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

        {status === 'VALIDATED' && (
          <Button
            variant="danger"
            isLoading={updating}
            onClick={() => onUpdateStatus('REFUSED')}
          >
            Suspendre / Refuser
          </Button>
        )}

        {status === 'REFUSED' && (
          <Button
            variant="primary"
            isLoading={updating}
            onClick={() => onUpdateStatus('PENDING_VALIDATION')}
          >
            Remettre en attente
          </Button>
        )}
      </span>
    </footer>
  );
}
