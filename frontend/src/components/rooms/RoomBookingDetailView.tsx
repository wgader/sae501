'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import RequestSuccessModal from '@/components/ui/RequestSuccessModal';
import {
  ApiError,
  OccupiedSlot,
  PublicRoom,
  createRoomReservation,
  getMediaUrl,
} from '@/lib/api';

interface RoomBookingDetailViewProps {
  room: PublicRoom;
  selectedStartDate: Date;
  selectedEndDate: Date;
  startHour: string;
  endHour: string;
  initialAttendees?: number | '';
  occupiedSlots: OccupiedSlot[];
  onBack: () => void;
  onReservationConflict: () => void;
  onReservationCreated: (newSlot: OccupiedSlot) => void;
}

const MONTH_NAMES = [
  'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
  'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE',
];

const WEEK_DAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatDateLong(d: Date): string {
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const monthNames = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ];
  return `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

function formatSlotDateTime(date: Date, hour: string): string {
  const [hours, minutes] = hour.split(':').map(Number);
  const dateTime = new Date(date);
  dateTime.setHours(hours, minutes, 0, 0);
  return dateTime.toISOString();
}

export default function RoomBookingDetailView({
  room,
  selectedStartDate,
  selectedEndDate,
  startHour,
  endHour,
  initialAttendees = '',
  occupiedSlots,
  onBack,
  onReservationConflict,
  onReservationCreated,
}: RoomBookingDetailViewProps) {
  const [motif, setMotif] = useState('');
  const [attendees, setAttendees] = useState<number | ''>(initialAttendees);
  const [file, setFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    id: number;
    statut: string;
    message: string;
  } | null>(null);

  const imageUrl = getMediaUrl(room.imageUrl);

  // Calendrier miniature pour le panneau latéral droit
  const miniCalendarDays = useMemo(() => {
    const year = selectedStartDate.getFullYear();
    const month = selectedStartDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const padding = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days: Array<Date | null> = [];
    for (let i = 0; i < padding; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));
    return days;
  }, [selectedStartDate]);

  // Validation temporelle & anti-chevauchement (Scénarios 2 & 4)
  const temporalValidation = useMemo(() => {
    if (!startHour || !endHour) {
      return { isValid: false, error: 'Horaires incomplets.' };
    }

    const now = new Date();
    const startDateTime = new Date(formatSlotDateTime(selectedStartDate, startHour));
    const endDateTime = new Date(formatSlotDateTime(selectedEndDate, endHour));

    if (endDateTime <= startDateTime) {
      return {
        isValid: false,
        error: 'La date et l’heure de fin doivent être postérieures au début.',
      };
    }

    if (startDateTime.getTime() <= now.getTime()) {
      return {
        isValid: false,
        error: 'Ce créneau horaire est passé.',
      };
    }

    // Vérification dynamique du chevauchement avec une réservation existante
    const hasOverlap = occupiedSlots.some((slot) => {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);
      return slotStart < endDateTime && slotEnd > startDateTime;
    });

    if (hasOverlap) {
      return {
        isValid: false,
        error: 'Ce créneau chevauche une réservation déjà existante.',
      };
    }

    return { isValid: true, error: null };
  }, [endHour, occupiedSlots, selectedEndDate, selectedStartDate, startHour]);

  // Validation de la capacité déclarée
  const capacityValidation = useMemo(() => {
    if (attendees === '') return { isValid: true, error: null };
    if (attendees <= 0) {
      return { isValid: false, error: 'L’effectif attendu doit être supérieur à zéro.' };
    }
    if (attendees > room.capaciteMax) {
      return {
        isValid: false,
        error: `L’effectif (${attendees}) dépasse la capacité max (${room.capaciteMax} pers.).`,
      };
    }
    return { isValid: true, error: null };
  }, [attendees, room.capaciteMax]);

  const canSubmit = useMemo(() => {
    return (
      temporalValidation.isValid &&
      capacityValidation.isValid &&
      !isSubmitting
    );
  }, [temporalValidation.isValid, capacityValidation.isValid, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    const startIso = formatSlotDateTime(selectedStartDate, startHour);
    const endIso = formatSlotDateTime(selectedEndDate, endHour);

    try {
      const result = await createRoomReservation({
        salleId: room.id,
        motifEvenement: motif.trim() || null,
        dateDebut: startIso,
        dateFin: endIso,
        capaciteAttendue: attendees === '' ? null : Number(attendees),
        justificatif: file,
      });

      // Scénario 1 : Soumission réussie
      setSuccessInfo({
        id: result.id,
        statut: result.statut,
        message: result.message,
      });

      onReservationCreated({
        id: result.id,
        start: startIso,
        end: endIso,
        statut: result.statut,
        isPreReserved: true,
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const isConflict =
          err.status === 409 ||
          (typeof err.data === 'object' &&
            err.data !== null &&
            'code' in err.data &&
            (err.data as { code?: string }).code === 'ROOM_SLOT_CONFLICT');

        if (isConflict) {
          onReservationConflict();
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
    <div className="space-y-8 animate-in fade-in">
      {/* Top bar with back button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted hover:text-ink cursor-pointer transition-colors"
        >
          ← RETOUR
        </button>

        <div className="mt-4">
          <p className="text-label font-bold uppercase tracking-eyebrow text-primary">
            Demande de salle
          </p>
          <h1 className="mt-1 text-4xl font-black tracking-display text-ink">
            Réserver une salle
          </h1>
        </div>
      </div>

      {/* Main two-column content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left column : Room presentation and reservation inputs */}
        <div className="space-y-6 lg:col-span-8">
          {/* Room Image */}
          <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-paper sm:h-96">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={room.nom}
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-paper text-muted">
                <svg
                  className="h-16 w-16 text-muted/40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M3 21h18" />
                  <path d="M5 21V7l7-4 7 4v14" />
                  <path d="M9 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                  <path d="M15 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                </svg>
              </div>
            )}
          </div>

          {/* Room info header */}
          <div>
            <p className="text-caption font-bold uppercase tracking-wider text-muted">
              Réception & Événement
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
              {room.nom}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
              <span>📍</span> {room.adresse}
            </p>

            {room.description && (
              <p className="mt-3 text-sm leading-relaxed text-ink/80">
                {room.description}
              </p>
            )}
          </div>

          {/* Spec details in 3 columns */}
          <div className="grid grid-cols-1 gap-4 border-y border-line py-5 sm:grid-cols-3">
            <div>
              <p className="text-caption font-bold uppercase tracking-wider text-muted">
                Capacité
              </p>
              <p className="mt-1 text-sm font-bold text-ink">
                {room.capaciteMax} personnes
              </p>
            </div>

            <div>
              <p className="text-caption font-bold uppercase tracking-wider text-muted">
                Équipements
              </p>
              <p className="mt-1 text-sm font-bold text-ink">
                {room.equipementsInclus && room.equipementsInclus.length > 0
                  ? room.equipementsInclus.join(', ')
                  : 'Équipements standards'}
              </p>
            </div>

            <div>
              <p className="text-caption font-bold uppercase tracking-wider text-muted">
                Accessibilité
              </p>
              <p className="mt-1 text-sm font-bold text-ink">
                {room.accesPmr ? 'Accès PMR disponible' : 'Standard'}
              </p>
            </div>
          </div>

          {/* Form fields for Motif and Justificatif */}
          <form id="room-reservation-form" onSubmit={handleSubmit} className="space-y-5 pt-2">
            {/* Erreur */}
            {errorMessage && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
                {errorMessage}
              </div>
            )}

            {/* Motif */}
            <div>
              <label htmlFor="detail-motif" className="block text-xs font-bold uppercase tracking-wider text-muted">
                Motif de l&apos;événement (nature de la manifestation) <span className="font-normal normal-case tracking-normal">(facultatif)</span>
              </label>
              <textarea
                id="detail-motif"
                rows={3}
                placeholder="Ex : Réunion générale annuelle, répétition de musique, atelier créatif..."
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white p-3 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Effectif attendu */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="detail-attendees" className="block text-xs font-bold uppercase tracking-wider text-muted">
                  Effectif attendu (nombre de personnes)
                </label>
                <span className="text-caption text-muted">
                  Capacité maximale : <strong>{room.capaciteMax} personnes</strong>
                </span>
              </div>
              <input
                id="detail-attendees"
                type="number"
                min={1}
                max={room.capaciteMax}
                placeholder={`Ex : 30 (max : ${room.capaciteMax})`}
                value={attendees}
                onChange={(e) => setAttendees(e.target.value ? Number(e.target.value) : '')}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {!capacityValidation.isValid && capacityValidation.error && (
                <p role="alert" className="mt-1 text-caption font-semibold text-red-600">
                  ⚠️ {capacityValidation.error}
                </p>
              )}
            </div>

            {/* Pièce justificative requise */}
            <div>
              <label htmlFor="detail-justificatif" className="block text-xs font-bold uppercase tracking-wider text-muted">
                Pièce justificative (Attestation d&apos;assurance responsabilité civile)
              </label>
              <p className="mt-0.5 text-caption text-muted">
                Formats acceptés : PDF, PNG, JPEG (10 Mo max)
              </p>
              <input
                id="detail-justificatif"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1.5 block w-full text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-paper file:px-3 file:py-2 file:text-xs file:font-bold file:text-ink hover:file:bg-line/60 cursor-pointer"
              />
              {file && (
                <p className="mt-1 text-caption text-emerald-700">
                  ✓ Fichier sélectionné : {file.name} ({(file.size / 1024).toFixed(1)} Ko)
                </p>
              )}
            </div>

            {!temporalValidation.isValid && temporalValidation.error && (
              <p role="alert" className="rounded-md bg-amber-50 p-2.5 text-caption font-semibold text-amber-800">
                ⚠️ {temporalValidation.error}
              </p>
            )}
          </form>
        </div>

        {/* Right column : "Vos créneaux - Rappel de votre créneau" (Image 2) */}
        <div className="lg:col-span-4">
          <aside className="sticky top-6 rounded-2xl border border-line bg-white p-6 shadow-xs space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
              <span className="h-2 w-2 rounded-full bg-muted/60" />
              <span>Vos créneaux · Rappel de votre créneau</span>
            </div>

            {/* Mini calendar widget */}
            <div className="rounded-xl border border-line bg-paper/30 p-4">
              <div className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-ink">
                {MONTH_NAMES[selectedStartDate.getMonth()]} {selectedStartDate.getFullYear()}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-caption font-bold text-muted pb-2">
                {WEEK_DAYS.map((d) => (
                  <div key={`mini-${d}`}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-caption">
                {miniCalendarDays.map((d, idx) => {
                  if (!d) return <div key={`mini-pad-${idx}`} className="h-6" />;
                  const isStartDate = isSameDay(d, selectedStartDate);
                  const isEndDate = isSameDay(d, selectedEndDate);

                  return (
                    <div
                      key={`mini-${d.toISOString()}`}
                      className={`flex h-6 w-6 items-center justify-center mx-auto rounded-full font-bold ${
                        isStartDate || isEndDate
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-ink/80'
                      }`}
                    >
                      {d.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary details */}
            <div className="space-y-3 border-t border-line pt-4 text-xs">
              <div>
                <p className="text-caption font-bold uppercase tracking-wider text-muted">
                  Date
                </p>
                <p className="mt-0.5 font-bold text-ink">
                  {formatDateLong(selectedStartDate)}
                  {!isSameDay(selectedStartDate, selectedEndDate) && (
                    <> - {formatDateLong(selectedEndDate)}</>
                  )}
                </p>
              </div>

              <div>
                <p className="text-caption font-bold uppercase tracking-wider text-muted">
                  Horaire
                </p>
                <p className="mt-0.5 font-bold text-ink">
                  {startHour} — {endHour}
                </p>
              </div>
            </div>

            {/* Action button */}
            <div className="pt-2">
              <button
                type="submit"
                form="room-reservation-form"
                disabled={!canSubmit}
                className={`w-full rounded-lg py-3 text-center text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all ${
                  canSubmit
                    ? 'bg-primary hover:bg-primary-hover cursor-pointer active:scale-98'
                    : 'cursor-not-allowed bg-line/60 text-muted'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Enregistrement...
                  </span>
                ) : (
                  'Valider la réservation →'
                )}
              </button>

              {!canSubmit && !isSubmitting && (
                <p className="mt-2 text-center text-caption text-muted">
                  Vérifiez les horaires et l&apos;effectif pour activer la réservation.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>

      <RequestSuccessModal
        isOpen={Boolean(successInfo)}
        onClose={() => setSuccessInfo(null)}
        title="Votre demande de réservation a bien été transmise"
        description={successInfo?.message}
      />
    </div>
  );
}

