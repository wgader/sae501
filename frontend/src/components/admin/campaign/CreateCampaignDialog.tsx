'use client';

import { useId, useState, type FormEvent } from 'react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { fieldControlVariants, fieldHintVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';
import CampaignPeriodFields from '@/components/admin/campaign/CampaignPeriodFields';
import { fromDateTimeInput } from '@/lib/campaignDates';
import type { CreateCampaignPayload } from '@/lib/api/campaigns';

interface CreateCampaignDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateCampaignPayload) => Promise<void>;
}

/**
 * Création d'une campagne annuelle. Valeurs proposées, modifiables : dépôt des demandes de juin à
 * fin septembre de l'année N, pour des créneaux du 1er janvier au 31 décembre de l'année N+1.
 * Passé septembre, la campagne proposée est celle de l'année suivante.
 */
export default function CreateCampaignDialog(props: CreateCampaignDialogProps) {
  return <CreateCampaignDialogContent key={props.open ? 'open' : 'closed'} {...props} />;
}

function CreateCampaignDialogContent({ open, onClose, onSubmit }: CreateCampaignDialogProps) {
  const now = new Date();
  // Année N du dépôt des demandes ; les créneaux réservés portent sur l'année N+1.
  const year = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
  const ids = { form: useId(), label: useId(), opening: useId(), closing: useId() };
  const [label, setLabel] = useState(`Campagne des salles ${year + 1}`);
  const [opening, setOpening] = useState(`${year}-06-01T00:00`);
  const [closing, setClosing] = useState(`${year}-09-30T23:59`);
  const [periodStart, setPeriodStart] = useState(`${year + 1}-01-01`);
  const [periodEnd, setPeriodEnd] = useState(`${year + 1}-12-31`);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!label.trim()) {
      setError('Indiquez le nom de la campagne.');
      return;
    }
    if (!opening || !closing || closing <= opening) {
      setError('La clôture doit être postérieure à l’ouverture.');
      return;
    }
    if (!periodStart || !periodEnd || periodEnd < periodStart) {
      setError('Indiquez les jours réservables, dans l’ordre.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        seasonLabel: label.trim(),
        openingAt: fromDateTimeInput(opening),
        closingAt: fromDateTimeInput(closing),
        periodStart,
        periodEnd,
        resourceTypes: ['salle'],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La campagne n’a pas pu être créée.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      size="sm"
      title="Nouvelle campagne"
      description="Elle s’ouvre et se clôture automatiquement aux dates choisies."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form={ids.form} size="sm" isLoading={isSubmitting}>
            Créer la campagne
          </Button>
        </>
      }
    >
      <form id={ids.form} onSubmit={handleSubmit} noValidate className="grid gap-4">
        <div>
          <label htmlFor={ids.label} className={fieldLabelVariants()}>
            Nom
          </label>
          <input
            id={ids.label}
            type="text"
            required
            maxLength={150}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className={fieldControlVariants()}
          />
        </div>
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
            className={fieldControlVariants()}
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
