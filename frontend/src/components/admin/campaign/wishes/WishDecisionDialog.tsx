'use client';

import { useId, useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { fieldControlVariants, fieldHintVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';
import type { AdminCampaignWish } from '@/lib/api';

export type WishDecision =
  | { mode: 'accept'; wish: AdminCampaignWish; competitors: number }
  | { mode: 'refuse'; wish: AdminCampaignWish };

interface WishDecisionDialogProps {
  decision: WishDecision | null;
  onClose: () => void;
  onAccept: (wish: AdminCampaignWish, refuseOthers: boolean) => Promise<void>;
  onRefuse: (wish: AdminCampaignWish, comment: string) => Promise<void>;
}

/** Confirmation d'une attribution (avec refus des concurrents) ou d'un refus motivé. */
export default function WishDecisionDialog({ decision, onClose, onAccept, onRefuse }: WishDecisionDialogProps) {
  const formId = useId();
  const commentId = useId();
  const [refuseOthers, setRefuseOthers] = useState(true);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setComment('');
    setRefuseOthers(true);
    setError(null);
    onClose();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!decision) return;
    setBusy(true);
    setError(null);
    try {
      if (decision.mode === 'accept') await onAccept(decision.wish, refuseOthers && decision.competitors > 0);
      else await onRefuse(decision.wish, comment);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La décision n’a pas pu être enregistrée.');
    } finally {
      setBusy(false);
    }
  };

  const wish = decision?.wish;
  const slot = wish ? `${wish.salle.nom}, ${wish.dayLabel.toLowerCase()} ${wish.startTime} – ${wish.endTime}` : '';

  return (
    <Dialog
      open={decision !== null}
      title={decision?.mode === 'refuse' ? 'Refuser le vœu' : 'Attribuer le créneau'}
      description={wish ? `${wish.association.nom} · ${slot}` : undefined}
      onClose={close}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={close} disabled={busy}>Annuler</Button>
          <Button type="submit" form={formId} size="sm" variant={decision?.mode === 'refuse' ? 'danger' : 'primary'} isLoading={busy}>
            {decision?.mode === 'refuse' ? 'Confirmer le refus' : 'Attribuer'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={(event) => void submit(event)} className="space-y-4">
        {decision?.mode === 'accept' ? (
          decision.competitors > 0 ? (
            <label className="flex cursor-pointer items-start gap-3 rounded-soft bg-paper p-4 text-body-sm text-ink">
              <input type="checkbox" checked={refuseOthers} onChange={(event) => setRefuseOthers(event.target.checked)} className="mt-0.5 accent-primary" />
              <span>
                Refuser en même temps les <strong>{decision.competitors}</strong> autre{decision.competitors > 1 ? 's' : ''} vœu
                {decision.competitors > 1 ? 'x' : ''} en attente sur ce créneau.
                <span className="block text-meta text-muted">Motif transmis : « Créneau attribué à une autre association. »</span>
              </span>
            </label>
          ) : (
            <p className="text-body-sm text-muted">Aucun autre vœu ne demande ce créneau.</p>
          )
        ) : (
          <div>
            <label htmlFor={commentId} className={fieldLabelVariants()}>Motif du refus</label>
            <textarea
              id={commentId}
              required
              rows={4}
              maxLength={1000}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Par exemple : la salle est réservée aux activités scolaires ce soir-là."
              className={fieldControlVariants()}
            />
            <p className={fieldHintVariants()}>Transmis à l’association.</p>
          </div>
        )}
        {error && <p role="alert" className={fieldHintVariants({ tone: 'danger' })}>{error}</p>}
      </form>
    </Dialog>
  );
}
