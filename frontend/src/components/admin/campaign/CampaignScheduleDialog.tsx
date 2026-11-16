'use client';

import { useId, useState, type FormEvent } from 'react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { fieldControlVariants, fieldHintVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';
import { fromDateTimeInput, toDateTimeInput } from '@/lib/campaignDates';
import type { Campaign } from '@/lib/api/types';

interface CampaignScheduleDialogProps {
  campaign: Campaign | null;
  onClose: () => void;
  onSubmit: (campaign: Campaign, openingAt: string, closingAt: string) => Promise<void>;
}

/** Avancer ou repousser l'ouverture et la clôture ; le statut suit les nouvelles dates. */
export default function CampaignScheduleDialog(props: CampaignScheduleDialogProps) {
  return <CampaignScheduleDialogContent key={props.campaign?.id ?? 'closed'} {...props} />;
}

function CampaignScheduleDialogContent({ campaign, onClose, onSubmit }: CampaignScheduleDialogProps) {
  const ids = { form: useId(), opening: useId(), closing: useId() };
  const [opening, setOpening] = useState(() => (campaign ? toDateTimeInput(campaign.openingAt) : ''));
  const [closing, setClosing] = useState(() => (campaign ? toDateTimeInput(campaign.closingAt) : ''));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!campaign) return;
    if (!opening || !closing || closing <= opening) {
      setError('La clôture doit être postérieure à l’ouverture.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(campaign, fromDateTimeInput(opening), fromDateTimeInput(closing));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Les dates n’ont pas pu être modifiées.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={campaign !== null}
      size="sm"
      title="Modifier les dates"
      description="Repousser la clôture d’une campagne clôturée la rouvre ; repousser l’ouverture la reprogramme."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form={ids.form} size="sm" isLoading={isSubmitting}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form id={ids.form} onSubmit={handleSubmit} noValidate className="grid gap-4">
        <div>
          <label htmlFor={ids.opening} className={fieldLabelVariants()}>
            Ouverture
          </label>
          <input
            id={ids.opening}
            type="datetime-local"
            required
            value={opening}
            onChange={(event) => setOpening(event.target.value)}
            className={fieldControlVariants()}
          />
        </div>
        <div>
          <label htmlFor={ids.closing} className={fieldLabelVariants()}>
            Clôture
          </label>
          <input
            id={ids.closing}
            type="datetime-local"
            required
            value={closing}
            onChange={(event) => setClosing(event.target.value)}
            className={fieldControlVariants({ invalid: Boolean(error) })}
          />
        </div>
        {error && (
          <p role="alert" className={fieldHintVariants({ tone: 'danger' })}>
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
}
