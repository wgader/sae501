import { fieldControlVariants, fieldHintVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';
import Button from '@/components/ui/Button';
import type { AdminEquipmentReservation } from '@/lib/api';

interface EquipmentRequestDecisionCardProps {
  reservation: AdminEquipmentReservation;
  note: string;
  isUpdating: boolean;
  onNoteChange: (note: string) => void;
  onDecide: (status: 'Validée' | 'Refusée') => void;
}

/** Décision de la mairie, toujours visible à côté du dossier. */
export default function EquipmentRequestDecisionCard({ reservation, note, isUpdating, onNoteChange, onDecide }: EquipmentRequestDecisionCardProps) {
  const isPending = reservation.statut === 'En attente';

  return (
    <aside aria-labelledby="request-decision-title" className="space-y-4 rounded-card border border-line bg-white p-5 shadow-card sm:p-6 lg:sticky lg:top-6 lg:col-span-4">
      <div>
        <h2 id="request-decision-title" className="text-lg font-black text-ink">
          Décision
        </h2>
        <p className="mt-1 text-body-sm text-muted">Elle sera enregistrée dans le dossier de l’association.</p>
      </div>

      {isPending ? (
        <>
          <div>
            <label htmlFor="request-internal-note" className={fieldLabelVariants()}>
              Note interne
            </label>
            <textarea
              id="request-internal-note"
              value={note}
              rows={4}
              maxLength={2000}
              disabled={isUpdating}
              onChange={(event) => onNoteChange(event.target.value)}
              className={fieldControlVariants()}
            />
            <p className={fieldHintVariants()}>Facultative, jamais visible par l’association.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="danger" disabled={isUpdating} onClick={() => onDecide('Refusée')}>
              Refuser
            </Button>
            <Button disabled={isUpdating} onClick={() => onDecide('Validée')}>
              Accepter
            </Button>
          </div>
        </>
      ) : (
        <div className="rounded-soft bg-paper p-4 text-body-sm text-ink">
          <p className="font-semibold">Cette demande a déjà été traitée.</p>
          {reservation.noteInterne && <p className="mt-2 whitespace-pre-wrap text-muted">{reservation.noteInterne}</p>}
        </div>
      )}
    </aside>
  );
}
