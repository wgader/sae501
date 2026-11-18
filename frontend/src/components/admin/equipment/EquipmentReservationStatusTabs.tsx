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
    <nav className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filtres de statut des réservations">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={activeStatus === tab.value}
          onClick={() => onChange(tab.value)}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-pill border px-4 py-2 text-meta font-bold transition-colors ${
            activeStatus === tab.value
              ? 'border-primary bg-primary text-white'
              : 'border-line bg-white text-ink hover:bg-paper'
          }`}
        >
          <span>{tab.label}</span>
          {tab.count !== null && (
            <span className={`rounded-pill px-2 py-0.5 text-caption ${
              activeStatus === tab.value ? 'bg-white/20 text-white' : 'bg-paper text-muted'
            }`}>
              {counts[tab.count]}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
