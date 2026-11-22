'use client';

import { useId, type ReactNode } from 'react';
import { fieldControlVariants, fieldHintVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';
import { IconTrash } from '@/components/ui/icons';
import type { PublicRoom } from '@/lib/api';
import { WISH_AUDIENCES, WISH_DAYS, WISH_FREQUENCIES, type WishDraft, type WishErrors, type WishField } from '@/lib/campaignWishes';

interface WishLineEditorProps {
  index: number;
  wish: WishDraft;
  rooms: PublicRoom[];
  errors: WishErrors;
  /** Ce vœu chevauche un autre vœu du dossier. */
  overlaps: boolean;
  showErrors: boolean;
  canRemove: boolean;
  onChange: (field: WishField, value: string) => void;
  onRemove: () => void;
}

/** Un vœu récurrent : salle, jour, horaires, fréquence, activité, public et effectif. */
export default function WishLineEditor({ index, wish, rooms, errors, overlaps, showErrors, canRemove, onChange, onRemove }: WishLineEditorProps) {
  const baseId = useId();
  const visible = (field: WishField) => (showErrors || field === 'endTime' ? errors[field] : undefined);

  const field = (name: WishField, label: string, control: (id: string, invalid: boolean) => ReactNode, wide = false) => {
    const id = `${baseId}-${name}`;
    const error = visible(name);
    return (
      <div className={wide ? 'sm:col-span-2 lg:col-span-4' : undefined}>
        <label htmlFor={id} className={fieldLabelVariants()}>{label}</label>
        {control(id, Boolean(error))}
        {error && <p id={`${id}-error`} className={fieldHintVariants({ tone: 'danger' })}>{error}</p>}
      </div>
    );
  };

  /** Attributs communs à chaque champ : valeur, erreur annoncée et style. */
  const control = (name: WishField, id: string, invalid: boolean) => ({
    id,
    value: wish[name],
    'aria-invalid': invalid,
    'aria-describedby': invalid ? `${id}-error` : undefined,
    onChange: (event: { target: { value: string } }) => onChange(name, event.target.value),
    className: fieldControlVariants({ invalid }),
  });

  const options = (placeholder: string, items: readonly { value: string | number; label: string }[]) => (
    <>
      <option value="">{placeholder}</option>
      {items.map((item) => (
        <option key={item.value} value={item.value}>{item.label}</option>
      ))}
    </>
  );

  const roomOptions = rooms.map((room) => ({ value: room.id, label: room.capaciteMax ? `${room.nom} (${room.capaciteMax} pers.)` : room.nom }));

  return (
    <fieldset className={`rounded-card border bg-white p-5 sm:p-6 ${overlaps ? 'border-danger' : 'border-line'}`}>
      <legend className="sr-only">Vœu {index + 1}</legend>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-body font-black text-ink" aria-hidden="true">Vœu {index + 1}</p>
        {canRemove && (
          <button type="button" onClick={onRemove} className="inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-meta font-bold text-muted transition-colors hover:bg-danger/10 hover:text-danger cursor-pointer">
            <IconTrash className="h-4 w-4" />
            Retirer
          </button>
        )}
      </div>
      {overlaps && (
        <p className="mb-4 rounded-soft bg-danger/10 px-3 py-2 text-meta font-semibold text-danger">
          Ce vœu chevauche un autre vœu de votre dossier (même salle, même jour).
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {field('salleId', 'Salle', (id, invalid) => <select {...control('salleId', id, invalid)}>{options('Choisir…', roomOptions)}</select>)}
        {field('dayOfWeek', 'Jour', (id, invalid) => <select {...control('dayOfWeek', id, invalid)}>{options('Choisir…', WISH_DAYS)}</select>)}
        {field('startTime', 'Début', (id, invalid) => <input type="time" step={900} {...control('startTime', id, invalid)} />)}
        {field('endTime', 'Fin', (id, invalid) => <input type="time" step={900} {...control('endTime', id, invalid)} />)}
        {field('frequency', 'Fréquence', (id, invalid) => <select {...control('frequency', id, invalid)}>{options('Choisir…', WISH_FREQUENCIES)}</select>)}
        {field('audience', 'Public', (id, invalid) => <select {...control('audience', id, invalid)}>{options('Choisir…', WISH_AUDIENCES)}</select>)}
        {field('expectedAttendance', 'Effectif prévu', (id, invalid) => <input type="number" min={1} inputMode="numeric" {...control('expectedAttendance', id, invalid)} />)}
        {field('activity', 'Activité', (id, invalid) => <input type="text" maxLength={120} placeholder="exemple : entraînement de basket U13" {...control('activity', id, invalid)} />, true)}
      </div>
    </fieldset>
  );
}
