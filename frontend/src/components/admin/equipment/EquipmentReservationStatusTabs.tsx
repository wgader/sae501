'use client';

import type { AdminEquipmentReservation } from '@/lib/api';

export type EquipmentReservationStatus = AdminEquipmentReservation['statut'] | '';

type Props = {
  activeStatus: EquipmentReservationStatus;
  counts: { pending: number; validated: number; refused: number };
  onChange: (status: EquipmentReservationStatus) => void;
};

const tabs: Array<{ value: EquipmentReservationStatus; label: string; count: keyof Props['counts'] | null }> = [
  { value: 'En attente', label: 'En attente', count: 'pending' },
  { value: 'Validée', label: 'Accepté', count: 'validated' },
  { value: 'Refusée', label: 'Refusé', count: 'refused' },
];

export default function EquipmentReservationStatusTabs({ activeStatus, counts, onChange }: Props) {
  return (
    <nav className="mt-5 flex flex-wrap items-center gap-3" role="tablist" aria-label="Filtres de statut des réservations">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={activeStatus === tab.value}
          onClick={() => onChange(tab.value)}
          className={`inline-flex items-center gap-2.5 rounded-pill px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeStatus === tab.value
              ? 'bg-primary text-white shadow-xs'
              : 'border border-primary bg-transparent text-primary hover:bg-primary/5'
          }`}
        >
          <span>{tab.label.toUpperCase()}</span>
          {tab.count !== null && (
            <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-pill px-1.5 text-label font-bold ${
              activeStatus === tab.value ? 'bg-accent text-ink' : 'bg-primary/15 text-primary'
            }`}>
              {counts[tab.count]}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
