'use client';

import { useMemo, useState } from 'react';
import { ApiError, OccupiedSlot, PublicRoom, createRoomReservation } from '@/lib/api';

interface RoomBookingFormProps {
  room: PublicRoom;
  selectedDate: Date;
  startHour: string;
  endHour: string;
  occupiedSlots: OccupiedSlot[];
  onStartHourChange: (val: string) => void;
  onEndHourChange: (val: string) => void;
  onRefreshCalendar: () => void;
  onReservationCreated: (newSlot: OccupiedSlot) => void;
}

function formatDateIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function RoomBookingForm({
  room,
  selectedDate,
  startHour,
  endHour,
  occupiedSlots,
  onStartHourChange,
  onEndHourChange,
  onRefreshCalendar,
  onReservationCreated,
}: RoomBookingFormProps) {
  const [motif, setMotif] = useState('');
  const [capaciteAttendue, setCapaciteAttendue] = useState<number | ''>('');
  const [file, setFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    id: number;
    statut: string;
    message: string;
  } | null>(null);

  const dateIso = formatDateIso(selectedDate);

  // Scénario 4 : Validation des incohérences temporelles
  const temporalValidation = useMemo(() => {
    if (!startHour || !endHour) {
      return { isValid: false, error: 'Veuillez renseigner l’heure de début et l’heure de fin.' };
    }

    // Vérification de l'ordre début/fin
    if (endHour <= startHour) {
      return {
        isValid: false,
        error: 'L’heure de fin doit être strictement postérieure à l’heure de début.',
      };
    }

    // Vérification des plages d'ouverture (08:00 - 23:00)
    const openingStart = room.horairesOuverture?.debut ?? '08:00';
    const openingEnd = room.horairesOuverture?.fin ?? '23:00';

    if (startHour < openingStart || endHour > openingEnd) {
      return {
        isValid: false,
        error: `La réservation doit se situer dans les plages d'ouverture de la salle (${openingStart} - ${openingEnd}).`,
      };
    }

    // Vérification de la date dans le passé
    const now = new Date();
    const startDateTime = new Date(`${dateIso}T${startHour}:00`);
    if (startDateTime.getTime() <= now.getTime()) {
      return {
        isValid: false,
        error: 'Ce créneau horaire est déjà passé. Veuillez sélectionner un horaire futur.',
      };
    }

    // Vérification dynamique du chevauchement avec une réservation existante
    const endDateTime = new Date(`${dateIso}T${endHour}:00`);
    const hasOverlap = occupiedSlots.some((slot) => {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);
      return slotStart < endDateTime && slotEnd > startDateTime;
    });

    if (hasOverlap) {
      return {
        isValid: false,
        error: 'Ce créneau chevauche une réservation déjà enregistrée ou pré-réservée.',
      };
    }

    return { isValid: true, error: null };
  }, [dateIso, startHour, endHour, room, occupiedSlots]);

  // Validation de l'effectif attendu vs capacité maximale de la salle (Checklist 4)
  const capacityValidation = useMemo(() => {
    if (capaciteAttendue === '') return { isValid: true, error: null };
    if (capaciteAttendue <= 0) {
      return { isValid: false, error: 'L’effectif attendu doit être strictement supérieur à zéro.' };
    }
    if (capaciteAttendue > room.capaciteMax) {
      return {
        isValid: false,
        error: `L’effectif attendu (${capaciteAttendue} personnes) dépasse la capacité maximale autorisée de la salle (${room.capaciteMax} personnes).`,
      };
    }
    return { isValid: true, error: null };
  }, [capaciteAttendue, room.capaciteMax]);

  const canSubmit = useMemo(() => {
    return (
      temporalValidation.isValid &&
      capacityValidation.isValid &&
      motif.trim().length > 0 &&
      !isSubmitting
    );
  }, [temporalValidation.isValid, capacityValidation.isValid, motif, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setConflictError(null);
    setErrorMessage(null);
    setIsSubmitting(true);

    const startIso = `${dateIso}T${startHour}:00+01:00`;
    const endIso = `${dateIso}T${endHour}:00+01:00`;

    try {
      const result = await createRoomReservation({
        salleId: room.id,
        motifEvenement: motif.trim(),
        dateDebut: startIso,
        dateFin: endIso,
        capaciteAttendue: capaciteAttendue === '' ? null : Number(capaciteAttendue),
        justificatif: file,
      });

      // Scénario 1 : Succès avec statut 'En attente de validation par la mairie'
      setSuccessInfo({
        id: result.id,
        statut: result.statut,
        message: result.message,
      });

      // Ajout dynamique du créneau pré-réservé dans le calendrier (Scénario 1)
      onReservationCreated({
        id: result.id,
        start: startIso,
        end: endIso,
        statut: result.statut,
        isPreReserved: true,
      });

      // Réinitialiser les champs
      setMotif('');
      setCapaciteAttendue('');
      setFile(null);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        // Scénario 3 : Conflit de réservation simultanée (Race condition 409)
        const isConflict =
          err.status === 409 ||
          (typeof err.data === 'object' &&
            err.data !== null &&
            'code' in err.data &&
            (err.data as { code?: string }).code === 'ROOM_SLOT_CONFLICT');

        if (isConflict) {
          setConflictError(
            err.message ||
              'Ce créneau horaire vient d’être réservé par un autre usager. Veuillez actualiser le calendrier et choisir un autre créneau.',
          );
        } else {
          setErrorMessage(err.message || 'Une erreur est survenue lors de l’enregistrement de votre demande.');
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Impossible d’enregistrer la réservation. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-xs">
      <header className="border-b border-line pb-4">
        <h3 className="text-xl font-black tracking-tight text-ink">
          Formulaire de demande de réservation
        </h3>
        <p className="mt-1 text-xs text-muted">
          Pour la salle <strong className="text-ink">{room.nom}</strong> le{' '}
          <strong className="text-ink">{dateIso}</strong>
        </p>
      </header>

      {/* Scénario 3 : Alerte dédiée en cas de conflit de réservation simultanée */}
      {conflictError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900 animate-in fade-in"
        >
          <div className="flex items-start gap-3">
            <span className="text-xl" aria-hidden="true">⚠️</span>
            <div className="flex-1">
              <h4 className="font-black text-sm text-red-800">
                Conflit de réservation simultanée
              </h4>
              <p className="mt-1 text-xs text-red-700 leading-relaxed">
                {conflictError}
              </p>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setConflictError(null);
                    onRefreshCalendar();
                  }}
                  className="rounded-md bg-red-800 px-3 py-1.5 text-caption font-bold uppercase tracking-wider text-white hover:bg-red-900 cursor-pointer shadow-xs"
                >
                  Actualiser le calendrier maintenant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Erreur générale */}
      {errorMessage && (
        <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          {errorMessage}
        </div>
      )}

      {/* Scénario 1 : Confirmation de soumission réussie */}
      {successInfo && (
        <div
          role="status"
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 animate-in fade-in"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl" aria-hidden="true">✅</span>
            <div>
              <h4 className="font-black text-base text-emerald-800">
                Demande transmise avec succès !
              </h4>
              <p className="mt-1 text-xs text-emerald-700 leading-relaxed">
                {successInfo.message}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-caption">
                <span className="rounded-md bg-emerald-200 px-2 py-0.5 font-bold text-emerald-800">
                  Statut : {successInfo.statut}
                </span>
                <span className="text-emerald-700">
                  ✉️ Un accusé de réception récapitulatif vous a été envoyé par email.
                </span>
              </div>
              <p className="mt-2 text-caption text-emerald-600">
                Le créneau apparaît désormais temporairement comme pré-réservé sur le calendrier.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Horaires début / fin */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="start-hour" className="block text-xs font-bold uppercase tracking-wider text-muted">
              Heure de début *
            </label>
            <input
              id="start-hour"
              type="time"
              required
              min={room.horairesOuverture?.debut ?? '08:00'}
              max={room.horairesOuverture?.fin ?? '23:00'}
              value={startHour}
              onChange={(e) => onStartHourChange(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="end-hour" className="block text-xs font-bold uppercase tracking-wider text-muted">
              Heure de fin *
            </label>
            <input
              id="end-hour"
              type="time"
              required
              min={room.horairesOuverture?.debut ?? '08:00'}
              max={room.horairesOuverture?.fin ?? '23:00'}
              value={endHour}
              onChange={(e) => onEndHourChange(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Message d'incohérence temporelle (Scénario 4) */}
        {!temporalValidation.isValid && temporalValidation.error && (
          <p role="alert" className="rounded-md bg-amber-50 p-2.5 text-caption font-semibold text-amber-800">
            ⚠️ {temporalValidation.error}
          </p>
        )}

        {/* Motif de l'événement */}
        <div>
          <label htmlFor="motif-evenement" className="block text-xs font-bold uppercase tracking-wider text-muted">
            Motif de l&apos;événement (nature de la manifestation) *
          </label>
          <textarea
            id="motif-evenement"
            required
            rows={3}
            placeholder="Ex : Réunion générale de rentrée, répétition de danse, atelier pédagogique..."
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-white p-3 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Effectif attendu (Checklist 4) */}
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="capacite-attendue" className="block text-xs font-bold uppercase tracking-wider text-muted">
              Effectif attendu (personnes)
            </label>
            <span className="text-caption text-muted">
              Capacité max de la salle : <strong>{room.capaciteMax} personnes</strong>
            </span>
          </div>
          <input
            id="capacite-attendue"
            type="number"
            min={1}
            max={room.capaciteMax}
            placeholder={`Ex : 50 (max ${room.capaciteMax})`}
            value={capaciteAttendue}
            onChange={(e) => setCapaciteAttendue(e.target.value ? Number(e.target.value) : '')}
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {!capacityValidation.isValid && capacityValidation.error && (
            <p role="alert" className="mt-1.5 text-caption font-semibold text-red-600">
              ⚠️ {capacityValidation.error}
            </p>
          )}
        </div>

        {/* Pièce justificative requise (ex: attestation assurance RC) */}
        <div>
          <label htmlFor="justificatif-file" className="block text-xs font-bold uppercase tracking-wider text-muted">
            Pièce justificative (Attestation d&apos;assurance responsabilité civile)
          </label>
          <p className="mt-0.5 text-caption text-muted">
            Formats acceptés : PDF, PNG, JPEG (10 Mo maximum)
          </p>
          <input
            id="justificatif-file"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0] ?? null;
              setFile(selectedFile);
            }}
            className="mt-1.5 block w-full text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-paper file:px-3 file:py-2 file:text-xs file:font-bold file:text-ink hover:file:bg-line/60 cursor-pointer"
          />
          {file && (
            <p className="mt-1 text-caption text-emerald-700">
              ✓ Fichier sélectionné : {file.name} ({(file.size / 1024).toFixed(1)} Ko)
            </p>
          )}
        </div>

        {/* Bouton de confirmation (Désactivé si incohérence temporelle - Scénario 4) */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full rounded-md py-3 text-center text-xs font-bold uppercase tracking-wider transition-all shadow-xs ${
              canSubmit
                ? 'bg-primary text-white hover:bg-primary-hover cursor-pointer active:scale-98'
                : 'cursor-not-allowed bg-line/60 text-muted'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Vérification et enregistrement...
              </span>
            ) : (
              'Confirmer ma demande de réservation'
            )}
          </button>

          {!canSubmit && !isSubmitting && (
            <p className="mt-2 text-center text-caption text-muted">
              Le bouton reste désactivé tant que les horaires ne sont pas valides, cohérents et le motif renseigné.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
