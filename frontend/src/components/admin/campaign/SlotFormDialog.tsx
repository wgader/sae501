'use client';

import { useId, useState, type FormEvent } from 'react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { fieldControlVariants, fieldHintVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';
import { slotDate, slotTime, toSlot } from '@/lib/campaignDates';
import type { CampaignRequest } from '@/lib/api/types';

export interface SlotFormValues {
  associationId: number | null;
  salleId: number;
  date: string;
  start: string;
  end: string;
  motif: string;
  reason: string;
}

export interface SlotFormSubmit {
  associationId: number | null;
  salleId: number;
  dateDebut: string;
  dateFin: string;
  motif: string;
  reason: string;
}

interface Option {
  id: number;
  nom: string;
}

interface SlotFormDialogProps {
  open: boolean;
  /** Demande à déplacer ; absente pour l'ajout d'un créneau. */
  request: CampaignRequest | null;
  salles: Option[];
  associations: Option[];
  onClose: () => void;
  onSubmit: (values: SlotFormSubmit) => Promise<void>;
}

function initialValues(request: CampaignRequest | null, salles: Option[]): SlotFormValues {
  return {
    associationId: request?.association.id ?? null,
    salleId: request?.salle.id ?? salles[0]?.id ?? 0,
    date: slotDate(request?.dateDebut ?? null),
    start: slotTime(request?.dateDebut ?? null) || '18:00',
    end: slotTime(request?.dateFin ?? null) || '20:00',
    motif: '',
    reason: '',
  };
}

/** Déplacement d'une demande (salle, jour, horaire) ou ajout d'un créneau à une association. */
export default function SlotFormDialog(props: SlotFormDialogProps) {
  // Le formulaire repart des valeurs de la demande à chaque ouverture.
  const key = props.open ? `open-${props.request?.id ?? 'new'}` : 'closed';
  return <SlotFormDialogContent key={key} {...props} />;
}

function SlotFormDialogContent({ open, request, salles, associations, onClose, onSubmit }: SlotFormDialogProps) {
  const isAdd = request === null;
  const ids = { form: useId(), association: useId(), salle: useId(), date: useId(), start: useId(), end: useId(), motif: useId(), reason: useId() };
  const [values, setValues] = useState<SlotFormValues>(() => initialValues(request, salles));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = <K extends keyof SlotFormValues>(field: K, value: SlotFormValues[K]) =>
    setValues((current) => ({ ...current, [field]: value }));

  const validationError = (() => {
    if (isAdd && !values.associationId) return 'Choisissez une association.';
    if (!values.salleId) return 'Choisissez une salle.';
    if (!values.date || !values.start || !values.end) return 'Indiquez le jour et les horaires.';
    if (values.end <= values.start) return 'L’heure de fin doit être après l’heure de début.';
    if (isAdd && !values.motif.trim()) return 'Indiquez l’objet du créneau.';
    return null;
  })();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        associationId: values.associationId,
        salleId: values.salleId,
        dateDebut: toSlot(values.date, values.start),
        dateFin: toSlot(values.date, values.end),
        motif: values.motif,
        reason: values.reason,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Le créneau n’a pas pu être enregistré.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      title={isAdd ? 'Ajouter un créneau' : 'Modifier la demande'}
      description={
        isAdd
          ? 'Le créneau est attribué directement : l’association est prévenue par e-mail et notification.'
          : `${request.association.nom} · la demande sera acceptée avec ce nouveau créneau.`
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form={ids.form} size="sm" isLoading={isSubmitting}>
            {isAdd ? 'Attribuer le créneau' : 'Enregistrer et accepter'}
          </Button>
        </>
      }
    >
      <form method="post" id={ids.form} onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        {isAdd && (
          <div className="sm:col-span-2">
            <label htmlFor={ids.association} className={fieldLabelVariants()}>
              Association
            </label>
            <select
              id={ids.association}
              required
              value={values.associationId ?? ''}
              onChange={(event) => update('associationId', event.target.value ? Number(event.target.value) : null)}
              className={fieldControlVariants()}
            >
              <option value="">Choisir une association</option>
              {associations.map((association) => (
                <option key={association.id} value={association.id}>
                  {association.nom}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="sm:col-span-2">
          <label htmlFor={ids.salle} className={fieldLabelVariants()}>
            Salle
          </label>
          <select
            id={ids.salle}
            required
            value={values.salleId || ''}
            onChange={(event) => update('salleId', Number(event.target.value))}
            className={fieldControlVariants()}
          >
            {salles.map((salle) => (
              <option key={salle.id} value={salle.id}>
                {salle.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={ids.date} className={fieldLabelVariants()}>
            Jour
          </label>
          <input
            id={ids.date}
            type="date"
            required
            value={values.date}
            onChange={(event) => update('date', event.target.value)}
            className={fieldControlVariants()}
          />
        </div>

        <div>
          <label htmlFor={ids.start} className={fieldLabelVariants()}>
            Début
          </label>
          <input
            id={ids.start}
            type="time"
            required
            min="08:00"
            max="23:00"
            step={900}
            value={values.start}
            onChange={(event) => update('start', event.target.value)}
            className={fieldControlVariants()}
          />
        </div>
        <div>
          <label htmlFor={ids.end} className={fieldLabelVariants()}>
            Fin
          </label>
          <input
            id={ids.end}
            type="time"
            required
            min="08:00"
            max="23:00"
            step={900}
            value={values.end}
            onChange={(event) => update('end', event.target.value)}
            className={fieldControlVariants()}
          />
        </div>

        {isAdd ? (
          <div className="sm:col-span-2">
            <label htmlFor={ids.motif} className={fieldLabelVariants()}>
              Objet du créneau
            </label>
            <input
              id={ids.motif}
              type="text"
              required
              maxLength={255}
              value={values.motif}
              placeholder="Par exemple : entraînement hebdomadaire"
              onChange={(event) => update('motif', event.target.value)}
              className={fieldControlVariants()}
            />
          </div>
        ) : (
          <div className="sm:col-span-2">
            <label htmlFor={ids.reason} className={fieldLabelVariants()}>
              Message à l’association{' '}
              <span className="font-normal normal-case tracking-normal text-muted">(facultatif)</span>
            </label>
            <textarea
              id={ids.reason}
              rows={3}
              maxLength={1000}
              value={values.reason}
              placeholder="Par exemple : la grande salle est déjà attribuée ce soir-là."
              onChange={(event) => update('reason', event.target.value)}
              className={fieldControlVariants()}
            />
          </div>
        )}

        <p className={`sm:col-span-2 ${fieldHintVariants()}`}>Les salles sont ouvertes de 8h à 23h.</p>
        {error && (
          <p role="alert" className={`sm:col-span-2 ${fieldHintVariants({ tone: 'danger' })}`}>
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
}
