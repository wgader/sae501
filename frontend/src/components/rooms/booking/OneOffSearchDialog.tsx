'use client';

import { useId, useMemo, useState } from 'react';
import SlotPicker from '@/components/booking/SlotPicker';
import { fieldControlVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { EMPTY_SLOT, isSlotComplete, normalizeSlot, type AvailabilityContext, type SlotSelection } from '@/lib/bookingAvailability';

export interface OneOffSearch {
  slot: SlotSelection;
  attendees: number | '';
}

interface OneOffSearchDialogProps {
  open: boolean;
  value: OneOffSearch;
  context: AvailabilityContext;
  onApply: (search: OneOffSearch) => void;
  onClose: () => void;
}

/** Recherche des salles libres sur des dates et un horaire, pour un effectif donné. */
export default function OneOffSearchDialog({ open, value, context, onApply, onClose }: OneOffSearchDialogProps) {
  const attendeesId = useId();
  const [draft, setDraft] = useState(value);
  const [wasOpen, setWasOpen] = useState(open);

  // À chaque ouverture, on repart de la recherche réellement appliquée.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(value);
  }

  const slot = useMemo(() => normalizeSlot(draft.slot, context), [draft.slot, context]);

  const apply = () => {
    onApply({ slot, attendees: draft.attendees });
    onClose();
  };

  return (
    <Dialog
      open={open}
      size="lg"
      title="Quand avez-vous besoin d’une salle ?"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={() => setDraft({ slot: EMPTY_SLOT, attendees: '' })}>
            Tout effacer
          </Button>
          <Button disabled={!isSlotComplete(slot)} onClick={apply}>
            Voir les salles libres
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <SlotPicker slot={slot} context={context} onChange={(next) => setDraft((current) => ({ ...current, slot: next }))} />
        <div>
          <label htmlFor={attendeesId} className={fieldLabelVariants()}>
            Nombre de personnes
          </label>
          <input
            id={attendeesId}
            type="number"
            min={1}
            placeholder="Ex : 50"
            value={draft.attendees}
            onChange={(event) =>
              setDraft((current) => ({ ...current, attendees: event.target.value ? Number(event.target.value) : '' }))
            }
            className={fieldControlVariants()}
          />
        </div>
      </div>
    </Dialog>
  );
}
