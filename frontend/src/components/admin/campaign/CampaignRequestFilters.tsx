import { useId } from 'react';
import { cva } from 'class-variance-authority';
import { fieldControlVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';
import type { CampaignRequestStatus } from '@/lib/api/types';

/** « conflict » : demandes en attente qui visent la même salle au même moment. */
export type CampaignRequestStatusFilter = CampaignRequestStatus | 'conflict' | 'all';

export interface CampaignRequestFilterValues {
  status: CampaignRequestStatusFilter;
  salleId: string;
  search: string;
}

interface CampaignRequestFiltersProps {
  values: CampaignRequestFilterValues;
  counts: Record<CampaignRequestStatusFilter, number>;
  salles: { id: number; nom: string }[];
  onChange: (values: CampaignRequestFilterValues) => void;
}

const STATUS_TABS: { value: CampaignRequestStatusFilter; label: string }[] = [
  { value: 'pending', label: 'À traiter' },
  { value: 'conflict', label: 'En conflit' },
  { value: 'accepted', label: 'Acceptées' },
  { value: 'refused', label: 'Refusées' },
  { value: 'all', label: 'Toutes' },
];

const statusTabVariants = cva(
  'inline-flex shrink-0 items-center gap-2 rounded-pill border px-4 py-2 text-meta font-bold transition-colors',
  {
    variants: {
      active: {
        true: 'border-primary bg-primary text-white',
        false: 'border-line bg-white text-ink hover:bg-paper',
      },
    },
  },
);

const countVariants = cva('rounded-pill px-2 py-0.5 text-caption', {
  variants: {
    active: {
      true: 'bg-white/20 text-white',
      false: 'bg-paper text-muted',
    },
  },
});

export default function CampaignRequestFilters({ values, counts, salles, onChange }: CampaignRequestFiltersProps) {
  const salleId = useId();
  const searchId = useId();

  return (
    <div className="space-y-4">
      <div role="group" aria-label="Filtrer par décision" className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const active = values.status === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ ...values, status: tab.value })}
              className={statusTabVariants({ active })}
            >
              {tab.label}
              <span className={countVariants({ active })}>{counts[tab.value]}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={salleId} className={fieldLabelVariants()}>
            Salle
          </label>
          <select
            id={salleId}
            value={values.salleId}
            onChange={(event) => onChange({ ...values, salleId: event.target.value })}
            className={fieldControlVariants()}
          >
            <option value="">Toutes les salles</option>
            {salles.map((salle) => (
              <option key={salle.id} value={String(salle.id)}>
                {salle.nom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={searchId} className={fieldLabelVariants()}>
            Association
          </label>
          <input
            id={searchId}
            type="search"
            value={values.search}
            placeholder="Rechercher une association"
            onChange={(event) => onChange({ ...values, search: event.target.value })}
            className={fieldControlVariants()}
          />
        </div>
      </div>
    </div>
  );
}
