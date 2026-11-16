'use client';

import { useId, useState, type FormEvent } from 'react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { fieldControlVariants, fieldHintVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';
import type { CampaignRequest } from '@/lib/api/types';

const MAX_LENGTH = 1000;

interface RefuseRequestDialogProps {
  request: CampaignRequest | null;
  onClose: () => void;
  onConfirm: (request: CampaignRequest, reason: string) => Promise<void>;
}

/** Refus d'une demande, avec un motif facultatif transmis à l'association. */
export default function RefuseRequestDialog({ request, onClose, onConfirm }: RefuseRequestDialogProps) {
  const reasonId = useId();
  const hintId = useId();
  const formId = useId();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const close = () => {
    setReason('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!request) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(request, reason);
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Le refus n’a pas pu être enregistré.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={request !== null}
      size="sm"
      title="Refuser la demande"
      description={request ? `${request.association.nom} · ${request.salle.nom}` : undefined}
      onClose={close}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={close}>
            Annuler
          </Button>
          <Button type="submit" form={formId} variant="danger" size="sm" isLoading={isSubmitting}>
            Confirmer le refus
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate>
        <label htmlFor={reasonId} className={fieldLabelVariants()}>
          Motif <span className="font-normal normal-case tracking-normal text-muted">(facultatif)</span>
        </label>
        <textarea
          id={reasonId}
          rows={4}
          maxLength={MAX_LENGTH}
          value={reason}
          aria-describedby={hintId}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Par exemple : la salle est réservée pour une manifestation municipale."
          className={fieldControlVariants()}
        />
        <p id={hintId} className={fieldHintVariants()}>
          L’association reçoit un e-mail et une notification avec ce message.
        </p>
        {error && (
          <p role="alert" className={fieldHintVariants({ tone: 'danger' })}>
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
}
