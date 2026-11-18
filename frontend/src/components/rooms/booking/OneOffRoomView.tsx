'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useId, useMemo, useState, type FormEvent } from 'react';
import SlotPicker from '@/components/rooms/booking/SlotPicker';
import { fieldControlVariants, fieldHintVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';
import Button from '@/components/ui/Button';
import Notice from '@/components/ui/Notice';
import { IconAccessible, IconArrowLeft, IconLocation, IconMembres, IconSalle } from '@/components/ui/icons';
import { useRoomOccupancy } from '@/hooks/useRoomOccupancy';
import { ApiError, createRoomReservation, getMediaUrl } from '@/lib/api';
import type { PublicRoom, RoomBookingRules } from '@/lib/api/types';
import {
  formatDuration,
  formatLongDay,
  formatTime,
  isSlotComplete,
  normalizeSlot,
  type AvailabilityContext,
  type SlotSelection,
} from '@/lib/roomAvailability';
import { roomDayKey, roomSlotInstant } from '@/lib/roomFilters';

interface OneOffRoomViewProps {
  room: PublicRoom;
  rules: RoomBookingRules;
  initialSlot: SlotSelection;
  initialAttendees: number | '';
  onBack: () => void;
}

function readClock() {
  const now = new Date();
  return { today: roomDayKey(now), nowMinutes: now.getHours() * 60 + now.getMinutes() };
}

/** Fiche d'une salle : disponibilités, choix du créneau et demande de réservation ponctuelle. */
export default function OneOffRoomView({ room, rules, initialSlot, initialAttendees, onBack }: OneOffRoomViewProps) {
  const motifId = useId();
  const attendeesId = useId();
  const fileId = useId();
  const [clock] = useState(readClock);
  const occupancy = useRoomOccupancy(room.id, clock.today, rules.lastDay);

  const [rawSlot, setRawSlot] = useState(initialSlot);
  const [motif, setMotif] = useState('');
  const [attendees, setAttendees] = useState<number | ''>(initialAttendees);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConflict, setIsConflict] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  const context = useMemo<AvailabilityContext>(
    () => ({ rules, busy: occupancy.busy ?? [], ...clock }),
    [rules, occupancy.busy, clock],
  );
  const slot = useMemo(() => normalizeSlot(rawSlot, context), [rawSlot, context]);

  const imageUrl = getMediaUrl(room.imageUrl);
  const exceedsCapacity = attendees !== '' && attendees > room.capaciteMax;
  const invalidAttendees = attendees !== '' && attendees <= 0;
  const canSubmit =
    isSlotComplete(slot) && !occupancy.loading && !occupancy.failed && motif.trim().length > 0 && !exceedsCapacity && !invalidAttendees && !isSubmitting;

  const missingStep = !isSlotComplete(slot)
    ? 'Choisissez vos dates et vos horaires.'
    : motif.trim().length === 0
      ? 'Indiquez le motif de votre événement.'
      : null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !isSlotComplete(slot)) return;

    setIsSubmitting(true);
    setError(null);
    setIsConflict(false);
    try {
      await createRoomReservation({
        salleId: room.id,
        motifEvenement: motif.trim(),
        dateDebut: roomSlotInstant(slot.startDay, slot.startTime),
        dateFin: roomSlotInstant(slot.endDay, slot.endTime),
        capaciteAttendue: attendees === '' ? null : attendees,
        justificatif: file,
        forCampaign: false,
      });
      setIsCreated(true);
      window.scrollTo({ top: 0 });
    } catch (err: unknown) {
      console.error('Réservation de la salle impossible', err);
      const conflict = err instanceof ApiError && err.status === 409;
      setIsConflict(conflict);
      setError(
        conflict
          ? 'Ce créneau vient d’être réservé par une autre association. Le calendrier a été mis à jour : choisissez un autre créneau.'
          : err instanceof Error
            ? err.message
            : 'Impossible d’enregistrer la réservation. Veuillez réessayer.',
      );
      if (conflict) occupancy.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCreated && isSlotComplete(slot)) {
    return (
      <Notice
        tone="success"
        title="Créneau réservé, en attente de confirmation"
        action={
          <div className="flex flex-wrap gap-3">
            <Link href="/historique" className="text-meta font-bold uppercase tracking-label text-primary hover:underline">
              Voir mes démarches
            </Link>
            <button type="button" onClick={onBack} className="cursor-pointer text-meta font-bold uppercase tracking-label text-ink hover:underline">
              Faire une autre demande
            </button>
          </div>
        }
      >
        {room.nom}, {slot.startDay === slot.endDay ? `le ${formatLongDay(slot.startDay)}` : `du ${formatLongDay(slot.startDay)} au ${formatLongDay(slot.endDay)}`}, de{' '}
        {formatTime(slot.startTime)} à {formatTime(slot.endTime)}. Le créneau est bloqué pour votre association jusqu’à la décision de la mairie. Un accusé de
        réception vous a été envoyé par e-mail.
      </Notice>
    );
  }

  return (
    <form method="post" onSubmit={submit} className="space-y-8">
      <header>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex cursor-pointer items-center gap-1.5 text-meta font-bold uppercase tracking-label text-muted transition-colors hover:text-ink"
        >
          <IconArrowLeft />
          Toutes les salles
        </button>
        <h1 className="mt-4 text-3xl font-black tracking-display text-ink sm:text-4xl">{room.nom}</h1>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-body-sm text-muted">
          <li className="flex items-center gap-1.5">
            <IconLocation className="h-4 w-4 shrink-0 text-primary" />
            {room.adresse}
          </li>
          <li className="flex items-center gap-1.5">
            <IconMembres className="h-4 w-4 shrink-0 text-primary" />
            {room.capaciteMax} personnes
          </li>
          {room.accesPmr && (
            <li className="flex items-center gap-1.5">
              <IconAccessible className="h-4 w-4 shrink-0 text-primary" />
              Accès PMR
            </li>
          )}
        </ul>
      </header>

      <div className="relative h-56 overflow-hidden rounded-card bg-paper sm:h-72">
        {imageUrl ? (
          <Image src={imageUrl} alt={room.nom} fill unoptimized sizes="(max-width: 1024px) 100vw, 80vw" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted/40">
            <IconSalle className="h-16 w-16" />
          </div>
        )}
      </div>

      {room.description && <p className="max-w-3xl text-body text-ink">{room.description}</p>}

      <div className="grid items-start gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <section aria-labelledby="room-slot-title" className="rounded-card border border-line bg-white p-5 sm:p-6">
            <h2 id="room-slot-title" className="text-lg font-black text-ink">
              Vos dates et horaires
            </h2>
            <p role="status" className="mt-1 mb-5 text-body-sm text-muted">
              {occupancy.loading ? 'Vérification des disponibilités…' : 'Touchez un jour, puis un second pour réserver plusieurs jours.'}
            </p>
            {occupancy.failed ? (
              <Notice
                tone="danger"
                title="Disponibilités indisponibles"
                action={
                  <Button variant="secondary" size="sm" onClick={occupancy.refresh}>
                    Réessayer
                  </Button>
                }
              >
                Impossible de charger le calendrier de cette salle.
              </Notice>
            ) : (
              <SlotPicker slot={slot} context={context} onChange={setRawSlot} />
            )}
          </section>

          <section aria-labelledby="room-event-title" className="space-y-5 rounded-card border border-line bg-white p-5 sm:p-6">
            <h2 id="room-event-title" className="text-lg font-black text-ink">
              Votre événement
            </h2>
            <div>
              <label htmlFor={motifId} className={fieldLabelVariants()}>
                Motif de l’événement *
              </label>
              <textarea
                id={motifId}
                required
                rows={3}
                value={motif}
                placeholder="Ex : assemblée générale, répétition, atelier…"
                onChange={(event) => setMotif(event.target.value)}
                className={fieldControlVariants()}
              />
            </div>
            <div>
              <label htmlFor={attendeesId} className={fieldLabelVariants()}>
                Nombre de personnes
              </label>
              <input
                id={attendeesId}
                type="number"
                min={1}
                max={room.capaciteMax}
                value={attendees}
                placeholder={`${room.capaciteMax} maximum`}
                aria-invalid={exceedsCapacity || invalidAttendees}
                onChange={(event) => setAttendees(event.target.value ? Number(event.target.value) : '')}
                className={fieldControlVariants({ invalid: exceedsCapacity || invalidAttendees })}
              />
              {exceedsCapacity && (
                <p role="alert" className={fieldHintVariants({ tone: 'danger' })}>
                  Cette salle accueille {room.capaciteMax} personnes au maximum.
                </p>
              )}
            </div>
            <div>
              <label htmlFor={fileId} className={fieldLabelVariants()}>
                Attestation d’assurance
              </label>
              <input
                id={fileId}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="mt-2 block w-full cursor-pointer text-meta text-muted file:mr-3 file:cursor-pointer file:rounded-control file:border-0 file:bg-paper file:px-4 file:py-2.5 file:text-meta file:font-bold file:text-ink hover:file:bg-line"
              />
              <p className={fieldHintVariants()}>PDF, PNG, JPEG ou WebP, 10 Mo maximum.</p>
            </div>
          </section>
        </div>

        <aside aria-label="Récapitulatif" className="space-y-4 rounded-card border border-line bg-white p-5 shadow-card sm:p-6 lg:sticky lg:top-6 lg:col-span-4">
          <h2 className="text-lg font-black text-ink">Récapitulatif</h2>
          {isSlotComplete(slot) ? (
            <dl className="space-y-3 border-t border-line pt-4 text-body-sm">
              <div>
                <dt className="text-label font-bold uppercase tracking-label text-muted">{slot.startDay === slot.endDay ? 'Date' : 'Du'}</dt>
                <dd className="mt-0.5 font-bold text-ink first-letter:uppercase">
                  {formatLongDay(slot.startDay)} à {formatTime(slot.startTime)}
                </dd>
              </div>
              <div>
                <dt className="text-label font-bold uppercase tracking-label text-muted">{slot.startDay === slot.endDay ? 'Fin' : 'Au'}</dt>
                <dd className="mt-0.5 font-bold text-ink first-letter:uppercase">
                  {slot.startDay === slot.endDay ? formatTime(slot.endTime) : `${formatLongDay(slot.endDay)} à ${formatTime(slot.endTime)}`}
                </dd>
              </div>
              <div>
                <dt className="text-label font-bold uppercase tracking-label text-muted">Durée</dt>
                <dd className="mt-0.5 font-bold text-ink">{formatDuration(slot)}</dd>
              </div>
            </dl>
          ) : (
            <p className="border-t border-line pt-4 text-body-sm text-muted">Aucun créneau sélectionné pour le moment.</p>
          )}

          {error && (
            <Notice tone="danger" title={isConflict ? 'Ce créneau n’est plus libre' : undefined}>
              {error}
            </Notice>
          )}

          <Button type="submit" disabled={!canSubmit} className="w-full">
            {isSubmitting ? 'Enregistrement…' : 'Réserver ce créneau'}
          </Button>
          {missingStep && <p className="text-center text-meta text-muted">{missingStep}</p>}
        </aside>
      </div>
    </form>
  );
}
