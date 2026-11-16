'use client';

import { useId, useState, type FormEvent } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { IconDownload } from '@/components/ui/icons';
import { fieldControlVariants, fieldHintVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';
import type { CampaignPlanningExportOptions, CampaignPlanningView } from '@/lib/api/campaigns';
import type { Campaign } from '@/lib/api/types';

const VIEWS: { value: CampaignPlanningView; label: string; hint: string }[] = [
  { value: 'complet', label: 'Dossier complet', hint: 'Planning général, puis par salle et par association.' },
  { value: 'general', label: 'Planning général', hint: 'Toutes les demandes, jour par jour.' },
  { value: 'salle', label: 'Par salle', hint: 'Pour repérer les salles disputées.' },
  { value: 'association', label: 'Par association', hint: 'À remettre à chaque association.' },
];

const choiceVariants = cva(
  'flex cursor-pointer items-start gap-3 rounded-soft border px-4 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-soft',
  {
    variants: {
      checked: {
        true: 'border-primary bg-primary-soft/50',
        false: 'border-line bg-white hover:bg-paper',
      },
    },
  },
);

interface CampaignExportDialogProps {
  campaign: Campaign | null;
  /** Premier et dernier jour demandés (AAAA-MM-JJ), pour préremplir une période personnalisée. */
  requestedRange: { from: string; to: string } | null;
  onClose: () => void;
  onExport: (campaign: Campaign, options: CampaignPlanningExportOptions) => Promise<void>;
}

/** Choix du contenu et de la période du planning PDF préparé pour la réunion d'arbitrage. */
export default function CampaignExportDialog({ campaign, requestedRange, onClose, onExport }: CampaignExportDialogProps) {
  const formId = useId();
  const fromId = useId();
  const toId = useId();
  const [view, setView] = useState<CampaignPlanningView>('complet');
  const [customPeriod, setCustomPeriod] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [includeRefused, setIncludeRefused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const close = () => {
    setError(null);
    onClose();
  };

  const choosePeriod = (custom: boolean) => {
    setCustomPeriod(custom);
    if (custom && !from && !to && requestedRange) {
      setFrom(requestedRange.from);
      setTo(requestedRange.to);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!campaign) return;
    if (customPeriod && (!from || !to)) {
      setError('Indiquez le premier et le dernier jour de la période.');
      return;
    }
    if (customPeriod && from > to) {
      setError('Le premier jour doit précéder le dernier.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onExport(campaign, customPeriod ? { view, from, to, includeRefused } : { view, includeRefused });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Le planning n’a pas pu être généré.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={campaign !== null}
      title="Exporter le planning en PDF"
      description={campaign?.seasonLabel}
      onClose={close}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={close}>
            Annuler
          </Button>
          <Button
            type="submit"
            form={formId}
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<IconDownload className="h-4 w-4" />}
          >
            Télécharger le PDF
          </Button>
        </>
      }
    >
      <form method="post" id={formId} onSubmit={handleSubmit} noValidate className="space-y-6">
        <fieldset>
          <legend className={fieldLabelVariants()}>Contenu</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {VIEWS.map((option) => (
              <label key={option.value} className={choiceVariants({ checked: view === option.value })}>
                <input
                  type="radio"
                  name="view"
                  value={option.value}
                  checked={view === option.value}
                  onChange={() => setView(option.value)}
                  className="mt-0.5 accent-primary"
                />
                <span>
                  <span className="block text-body-sm font-bold text-ink">{option.label}</span>
                  <span className="block text-meta text-muted">{option.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className={fieldLabelVariants()}>Période</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className={choiceVariants({ checked: !customPeriod })}>
              <input type="radio" name="period" checked={!customPeriod} onChange={() => choosePeriod(false)} className="mt-0.5 accent-primary" />
              <span className="text-body-sm font-bold text-ink">Toute la campagne</span>
            </label>
            <label className={choiceVariants({ checked: customPeriod })}>
              <input type="radio" name="period" checked={customPeriod} onChange={() => choosePeriod(true)} className="mt-0.5 accent-primary" />
              <span className="text-body-sm font-bold text-ink">Période choisie</span>
            </label>
          </div>
          {customPeriod && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={fromId} className={fieldLabelVariants()}>
                  Du
                </label>
                <input id={fromId} type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} className={fieldControlVariants()} />
              </div>
              <div>
                <label htmlFor={toId} className={fieldLabelVariants()}>
                  Au
                </label>
                <input id={toId} type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} className={fieldControlVariants()} />
              </div>
            </div>
          )}
        </fieldset>

        <label className="flex cursor-pointer items-start gap-3 text-body-sm text-ink">
          <input
            type="checkbox"
            checked={includeRefused}
            onChange={(event) => setIncludeRefused(event.target.checked)}
            className="mt-0.5 accent-primary"
          />
          <span>
            Inclure les demandes refusées
            <span className={cn('block', fieldHintVariants())}>Par défaut, seules les demandes en attente et acceptées figurent au planning.</span>
          </span>
        </label>

        {error && (
          <p role="alert" className={fieldHintVariants({ tone: 'danger' })}>
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
}
