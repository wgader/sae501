import Button from '@/components/ui/Button';
import Notice from '@/components/ui/Notice';
import { formatDuration, formatLongDay, formatTime, isSlotComplete, type SlotSelection } from '@/lib/bookingAvailability';

interface EquipmentReservationRecapProps {
  slot: SlotSelection;
  quantity: number;
  canSubmit: boolean;
  isSubmitting: boolean;
  error: string | null;
  hint: string | null;
}

const termClassName = 'text-label font-bold uppercase tracking-label text-muted';
const valueClassName = 'mt-0.5 font-bold text-ink first-letter:uppercase';

/** Récapitulatif de la demande, toujours visible à côté du formulaire. */
export default function EquipmentReservationRecap({
  slot,
  quantity,
  canSubmit,
  isSubmitting,
  error,
  hint,
}: EquipmentReservationRecapProps) {
  return (
    <aside aria-label="Récapitulatif" className="space-y-4 rounded-card border border-line bg-white p-5 shadow-card sm:p-6 lg:sticky lg:top-6 lg:col-span-4">
      <h2 className="text-lg font-black text-ink">Récapitulatif</h2>

      {isSlotComplete(slot) ? (
        <dl className="space-y-3 border-t border-line pt-4 text-body-sm">
          <div>
            <dt className={termClassName}>Retrait</dt>
            <dd className={valueClassName}>
              {formatLongDay(slot.startDay)} à {formatTime(slot.startTime)}
            </dd>
          </div>
          <div>
            <dt className={termClassName}>Restitution</dt>
            <dd className={valueClassName}>
              {formatLongDay(slot.endDay)} à {formatTime(slot.endTime)}
            </dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className={termClassName}>Durée</dt>
              <dd className={valueClassName}>{formatDuration(slot)}</dd>
            </div>
            <div>
              <dt className={termClassName}>Quantité</dt>
              <dd className={valueClassName}>
                {quantity} unité{quantity > 1 ? 's' : ''}
              </dd>
            </div>
          </div>
        </dl>
      ) : (
        <p className="border-t border-line pt-4 text-body-sm text-muted">Aucune période sélectionnée pour le moment.</p>
      )}

      {error && <Notice tone="danger">{error}</Notice>}

      <Button type="submit" disabled={!canSubmit} className="w-full">
        {isSubmitting ? 'Envoi…' : 'Valider la demande'}
      </Button>
      {hint && <p className="text-center text-meta text-muted">{hint}</p>}
    </aside>
  );
}
