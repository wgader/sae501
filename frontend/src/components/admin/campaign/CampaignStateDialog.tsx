'use client';

import { useId, useState } from 'react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { fieldControlVariants, fieldHintVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';
import { fromDateTimeInput, toDateTimeInput } from '@/lib/campaignDates';
import type { Campaign } from '@/lib/api/types';

export type CampaignStateAction = 'open' | 'close' | 'reopen';

/** Clôture proposée à la réouverture : celle prévue si elle n'est pas passée, sinon dans une semaine. */
function defaultReopenClosing(campaign: Campaign | null): string {
  const planned = campaign ? new Date(campaign.closingAt) : null;
  const closing = planned && planned.getTime() > Date.now() ? planned : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return toDateTimeInput(closing.toISOString());
}

interface CampaignStateDialogProps {
  campaign: Campaign | null;
  action: CampaignStateAction | null;
  onClose: () => void;
  /** closingAt : nouvelle clôture (ISO) en cas de réouverture. */
  onConfirm: (campaign: Campaign, action: CampaignStateAction, closingAt?: string) => Promise<void>;
}

const COPY: Record<CampaignStateAction, { title: string; description: string; confirm: string }> = {
  open: {
    title: 'Ouvrir la campagne maintenant ?',
    description: 'Les associations pourront déposer leurs demandes de salle dès maintenant.',
    confirm: 'Ouvrir',
  },
  close: {
    title: 'Clôturer la campagne ?',
    description:
      'Les associations ne pourront plus déposer, modifier ni annuler leurs demandes. Vous gardez la main pour les traiter, et pourrez rouvrir la campagne si besoin.',
    confirm: 'Clôturer',
  },
  reopen: {
    title: 'Rouvrir la campagne ?',
    description:
      'Les associations retrouvent leurs demandes telles qu’elles étaient et peuvent à nouveau en déposer jusqu’à la nouvelle clôture.',
    confirm: 'Rouvrir',
  },
};

export default function CampaignStateDialog(props: CampaignStateDialogProps) {
  return <CampaignStateDialogContent key={`${props.campaign?.id}-${props.action}`} {...props} />;
}

function CampaignStateDialogContent({ campaign, action, onClose, onConfirm }: CampaignStateDialogProps) {
  const closingId = useId();
  const [closing, setClosing] = useState(() => defaultReopenClosing(campaign));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const copy = action ? COPY[action] : COPY.open;

  const confirm = async () => {
    if (!campaign || !action) return;
    if (action === 'reopen' && !closing) {
      setError('Indiquez la nouvelle date de clôture.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(campaign, action, action === 'reopen' ? fromDateTimeInput(closing) : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'L’opération a échoué.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const close = () => {
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={campaign !== null && action !== null}
      size="sm"
      title={copy.title}
      description={campaign?.seasonLabel}
      onClose={close}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={close}>
            Annuler
          </Button>
          <Button variant={action === 'close' ? 'danger' : 'primary'} size="sm" isLoading={isSubmitting} onClick={confirm}>
            {copy.confirm}
          </Button>
        </>
      }
    >
      <p className="text-body-sm text-ink">{copy.description}</p>
      {action === 'reopen' && (
        <div className="mt-4">
          <label htmlFor={closingId} className={fieldLabelVariants()}>
            Nouvelle clôture des demandes
          </label>
          <input
            id={closingId}
            type="datetime-local"
            value={closing}
            onChange={(event) => setClosing(event.target.value)}
            className={fieldControlVariants()}
          />
        </div>
      )}
      {error && (
        <p role="alert" className={fieldHintVariants({ tone: 'danger' })}>
          {error}
        </p>
      )}
    </Dialog>
  );
}
