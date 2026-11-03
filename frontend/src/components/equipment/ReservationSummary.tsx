'use client';

import FormField from '@/components/ui/FormField';
import { EquipmentAvailability } from '@/lib/api';

type ReservationSummaryProps = {
  equipment: EquipmentAvailability;
  quantity: number;
  motif: string;
  onMotifChange: (value: string) => void;
};

export default function ReservationSummary({
  equipment,
  quantity,
  motif,
  onMotifChange,
}: ReservationSummaryProps) {
  return (
    <section aria-labelledby="reservation-summary" className="space-y-5 border-t border-line pt-6">
      <div>
        <h2 id="reservation-summary" className="text-lg font-bold text-ink">
          Récapitulatif
        </h2>
        <div className="mt-4 flex items-center justify-between rounded-control bg-paper px-4 py-3 text-sm">
          <span className="font-semibold text-ink">{equipment.designation}</span>
          <span className="font-bold text-primary">{quantity} unité{quantity > 1 ? 's' : ''}</span>
        </div>
      </div>

      <FormField
        label="Motif de l'événement"
        name="motifEvenement"
        value={motif}
        onChange={(event) => onMotifChange(event.target.value)}
        placeholder="Ex. fête de quartier, assemblée générale..."
        required
      />
    </section>
  );
}
