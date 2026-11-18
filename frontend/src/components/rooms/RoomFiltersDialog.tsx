'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import {
  DEFAULT_ROOM_FILTERS,
  ROOM_CAPACITY_OPTIONS,
  matchesRoomFilters,
  type RoomFilters,
} from '@/lib/roomFilters';
import type { PublicRoom } from '@/lib/api/types';

interface RoomFiltersDialogProps {
  open: boolean;
  /** Salles déjà retenues pour le créneau : sert à annoncer le nombre de résultats. */
  rooms: PublicRoom[];
  filters: RoomFilters;
  onApply: (filters: RoomFilters) => void;
  onClose: () => void;
}

/** Affine la liste des salles par capacité et accessibilité. */
export default function RoomFiltersDialog({ open, rooms, filters, onApply, onClose }: RoomFiltersDialogProps) {
  const [draft, setDraft] = useState(filters);
  const [wasOpen, setWasOpen] = useState(open);

  // À chaque ouverture, on repart des filtres réellement appliqués.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(filters);
  }

  const resultCount = rooms.filter((room) => matchesRoomFilters(room, draft)).length;
  const resultLabel = `Voir ${resultCount} salle${resultCount > 1 ? 's' : ''}`;

  const apply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <Dialog
      open={open}
      size="sm"
      title="Filtrer les salles"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={() => setDraft(DEFAULT_ROOM_FILTERS)}>
            Réinitialiser
          </Button>
          <Button onClick={apply}>{resultLabel}</Button>
        </>
      }
    >
      <form method="post" className="space-y-6" onSubmit={(event) => event.preventDefault()}>
        <fieldset>
          <legend className="text-label font-bold uppercase tracking-label text-muted">Capacité</legend>
          <div className="mt-3 space-y-3">
            {ROOM_CAPACITY_OPTIONS.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-3 text-body-sm font-bold text-ink">
                <input
                  type="radio"
                  name="room-capacity"
                  value={option.value}
                  checked={draft.capacity === option.value}
                  onChange={() => setDraft((current) => ({ ...current, capacity: option.value }))}
                  className="h-4 w-4 accent-primary"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-label font-bold uppercase tracking-label text-muted">Accessibilité</legend>
          <label className="mt-3 flex cursor-pointer items-center gap-3 text-body-sm font-bold text-ink">
            <input
              type="checkbox"
              checked={draft.accessible}
              onChange={(event) => setDraft((current) => ({ ...current, accessible: event.target.checked }))}
              className="h-4 w-4 accent-primary"
            />
            Accessible aux personnes à mobilité réduite
          </label>
        </fieldset>
      </form>
    </Dialog>
  );
}
