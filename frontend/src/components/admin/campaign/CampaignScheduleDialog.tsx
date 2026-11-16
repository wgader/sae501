'use client';

import { useId, useState, type FormEvent } from 'react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { fieldControlVariants, fieldHintVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';
import CampaignPeriodFields from '@/components/admin/campaign/CampaignPeriodFields';
import { fromDateTimeInput, toDateTimeInput } from '@/lib/campaignDates';
import type { CampaignSchedulePayload } from '@/lib/api/campaigns';
import type { Campaign } from '@/lib/api/types';

interface CampaignScheduleDialogProps {
  campaign: Campaign | null;
  onClose: () => void;
  onSubmit: (campaign: Campaign, payload: CampaignSchedulePayload) => Promise<void>;
}

/** Dates de dépôt et jours réservables ; le statut suit les nouvelles dates. */
export default function CampaignScheduleDialog(props: CampaignScheduleDialogProps) {
  return <CampaignScheduleDialogContent key={props.campaign?.id ?? 'closed'} {...props} />;
}

function CampaignScheduleDialogContent({ campaign, onClose, onSubmit }: CampaignScheduleDialogProps) {
  const ids = { form: useId(), opening: useId(), closing: useId() };
  const [opening, setOpening] = useState(() => (campaign ? toDateTimeInput(campaign.openingAt) : ''));
  const [closing, setClosing] = useState(() => (campaign ? toDateTimeInput(campaign.closingAt) : ''));
  const [periodStart, setPeriodStart] = useState(() => campaign?.periodStart?.slice(0, 10) ?? '');
  const [periodEnd, setPeriodEnd] = useState(() => campaign?.periodEnd?.slice(0, 10) ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!campaign) return;
    if (!opening || !closing || closing <= opening) {
      setError('La clôture doit être postérieure à l’ouverture.');
      return;
    }
    if (periodStart && periodEnd && periodEnd < periodStart) {
      setError('Les jours réservables doivent être dans l’ordre.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(campaign, {
        openingAt: fromDateTimeInput(opening),
        closingAt: fromDateTimeInput(closing),
        periodStart: periodStart || null,
        periodEnd: periodEnd || null,
      });
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
      title="Dates de la campagne"
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
      <form method="post" id={ids.form} onSubmit={handleSubmit} noValidate className="grid gap-4">
        <div>
          <label htmlFor={ids.opening} className={fieldLabelVariants()}>
            Ouverture des demandes
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
            Clôture des demandes
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
        <CampaignPeriodFields start={periodStart} end={periodEnd} onStartChange={setPeriodStart} onEndChange={setPeriodEnd} />
        {error && (
          <p role="alert" className={fieldHintVariants({ tone: 'danger' })}>
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
}
