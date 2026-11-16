'use client';

import { useId, useState, type FormEvent } from 'react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { fieldControlVariants, fieldHintVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';
import type { CampaignRequest } from '@/lib/api/types';

const MAX_LENGTH = 1000;

export type ReasonIntent = 'refuse' | 'cancel';

const COPY: Record<ReasonIntent, { title: string; confirm: string; placeholder: string; fallbackError: string }> = {
  refuse: {
    title: 'Refuser la demande',
    confirm: 'Confirmer le refus',
    placeholder: 'Par exemple : la salle est réservée pour une manifestation municipale.',
    fallbackError: 'Le refus n’a pas pu être enregistré.',
  },
  cancel: {
    title: 'Annuler la réservation',
    confirm: 'Confirmer l’annulation',
    placeholder: 'Par exemple : la salle est fermée pour travaux ce jour-là.',
    fallbackError: 'L’annulation n’a pas pu être enregistrée.',
  },
};

interface RefuseRequestDialogProps {
  request: CampaignRequest | null;
  intent?: ReasonIntent;
  onClose: () => void;
  onConfirm: (request: CampaignRequest, reason: string) => Promise<void>;
}

/** Refus ou annulation d'une demande, avec un motif facultatif transmis à l'association. */
export default function RefuseRequestDialog({ request, intent = 'refuse', onClose, onConfirm }: RefuseRequestDialogProps) {
  const copy = COPY[intent];
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
      setError(err instanceof Error ? err.message : copy.fallbackError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={request !== null}
      size="sm"
      title={copy.title}
      description={request ? `${request.association.nom} · ${request.salle.nom}` : undefined}
      onClose={close}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={close}>
            Retour
          </Button>
          <Button type="submit" form={formId} variant="danger" size="sm" isLoading={isSubmitting}>
            {copy.confirm}
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
          placeholder={copy.placeholder}
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
