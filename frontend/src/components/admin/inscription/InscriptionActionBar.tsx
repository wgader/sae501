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
          </>
        )}

        {status === 'VALIDATED' && (
          <>
            <Button
              variant="secondary"
              disabled={updating}
              onClick={() => onUpdateStatus('PENDING_VALIDATION')}
              leftIcon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              }
            >
              Remettre en attente
            </Button>

            <Button
              variant="danger"
              isLoading={updating}
              onClick={() => onUpdateStatus('REFUSED')}
              leftIcon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
            >
              Refuser la demande
            </Button>
          </>
        )}

        {status === 'REFUSED' && (
          <>
            <Button
              variant="secondary"
              disabled={updating}
              onClick={() => onUpdateStatus('PENDING_VALIDATION')}
              leftIcon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              }
            >
              Remettre en attente
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
      </span>
    </footer>
  );
}

