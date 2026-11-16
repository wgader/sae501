'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';
import { fieldControlVariants, fieldHintVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';

interface CampaignPeriodFieldsProps {
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}

/** Jours que les associations peuvent demander pendant la campagne (ex. septembre à juin). */
export default function CampaignPeriodFields({ start, end, onStartChange, onEndChange }: CampaignPeriodFieldsProps) {
  const ids = { start: useId(), end: useId(), hint: useId() };

  return (
    <fieldset className="grid gap-4 rounded-soft bg-paper p-4 sm:grid-cols-2">
      <legend className="sr-only">Créneaux réservables</legend>
      <p aria-hidden="true" className="text-body-sm font-bold text-ink sm:col-span-2">
        Créneaux réservables
      </p>
      <div>
        <label htmlFor={ids.start} className={fieldLabelVariants()}>
          Du
        </label>
        <input
          id={ids.start}
          type="date"
          value={start}
          max={end || undefined}
          aria-describedby={ids.hint}
          onChange={(event) => onStartChange(event.target.value)}
          className={fieldControlVariants()}
        />
      </div>
      <div>
        <label htmlFor={ids.end} className={fieldLabelVariants()}>
          Au
        </label>
        <input
          id={ids.end}
          type="date"
          value={end}
          min={start || undefined}
          aria-describedby={ids.hint}
          onChange={(event) => onEndChange(event.target.value)}
          className={fieldControlVariants()}
        />
      </div>
      <p id={ids.hint} className={cn(fieldHintVariants(), 'mt-0 sm:col-span-2')}>
        Pendant la campagne, seuls ces jours peuvent être demandés. Avant son ouverture, ils ne sont plus proposés en
        réservation ponctuelle.
      </p>
    </fieldset>
  );
}
