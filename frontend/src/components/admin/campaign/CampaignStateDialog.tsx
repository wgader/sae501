'use client';

import { useState } from 'react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { fieldHintVariants } from '@/components/admin/campaign/fieldStyles';
import type { Campaign } from '@/lib/api/types';

export type CampaignStateAction = 'open' | 'close';

interface CampaignStateDialogProps {
  campaign: Campaign | null;
  action: CampaignStateAction | null;
  onClose: () => void;
  onConfirm: (campaign: Campaign, action: CampaignStateAction) => Promise<void>;
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
      'Les nouvelles demandes ne seront plus rattachées à la campagne. Vous pourrez toujours traiter les demandes reçues ou la rouvrir en repoussant sa date de clôture.',
    confirm: 'Clôturer',
  },
};

export default function CampaignStateDialog({ campaign, action, onClose, onConfirm }: CampaignStateDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const copy = action ? COPY[action] : COPY.open;

  const confirm = async () => {
    if (!campaign || !action) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(campaign, action);
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
      {error && (
        <p role="alert" className={fieldHintVariants({ tone: 'danger' })}>
          {error}
        </p>
      )}
    </Dialog>
  );
}
