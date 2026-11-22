'use client';

import Link from 'next/link';
import { useId, useMemo, useState, type FormEvent } from 'react';
import SlotPicker from '@/components/booking/SlotPicker';
import { fieldControlVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';
import EquipmentDetailVisual from '@/components/equipment/EquipmentDetailVisual';
import EquipmentQuantitySelector from '@/components/equipment/EquipmentQuantitySelector';
import EquipmentReservationRecap from '@/components/equipment/reservation/EquipmentReservationRecap';
import Button from '@/components/ui/Button';
import Notice from '@/components/ui/Notice';
import { IconArrowLeft, IconCampagne, IconMateriel } from '@/components/ui/icons';
import { useEquipmentOccupancy } from '@/hooks/useEquipmentOccupancy';
import { useEquipmentPeriodStock } from '@/hooks/useEquipmentPeriodStock';
import { ApiError, createEquipmentReservation } from '@/lib/api';
import type { Equipment } from '@/lib/api/types';
import { EMPTY_SLOT, isSlotComplete, normalizeSlot, readBookingClock, type SlotSelection } from '@/lib/bookingAvailability';
import { getEquipmentCategoryLabel } from '@/lib/equipmentCategories';
import { buildEquipmentContext, toEquipmentInstant } from '@/lib/equipmentOccupancy';
import { logger } from '@/lib/logger';

interface EquipmentReservationViewProps {
  equipment: Equipment;
}

/** Réservation d'un équipement : période sur le calendrier, quantité, puis motif. */
export default function EquipmentReservationView({ equipment }: EquipmentReservationViewProps) {
  const motifId = useId();
  const [clock] = useState(readBookingClock);
  const occupancy = useEquipmentOccupancy(equipment.id);

  const [rawSlot, setRawSlot] = useState<SlotSelection>(EMPTY_SLOT);
  const [requestedQuantity, setRequestedQuantity] = useState(1);
  const [motif, setMotif] = useState('');
  const [stockVersion, setStockVersion] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreated, setIsCreated] = useState(false);

  const context = useMemo(
    () => (occupancy.occupancy ? buildEquipmentContext(occupancy.occupancy, clock) : null),
    [occupancy.occupancy, clock],
  );
  const slot = useMemo(() => (context ? normalizeSlot(rawSlot, context) : EMPTY_SLOT), [rawSlot, context]);

  const start = isSlotComplete(slot) ? toEquipmentInstant(slot.startDay, slot.startTime) : null;
  const end = isSlotComplete(slot) ? toEquipmentInstant(slot.endDay, slot.endTime) : null;
  const stock = useEquipmentPeriodStock(equipment.id, start, end, stockVersion);

  const maximum = stock.available ?? 0;
  const quantity = Math.max(1, Math.min(requestedQuantity, maximum));
  const hasStock = stock.available !== null && stock.available > 0;
  const canSubmit = isSlotComplete(slot) && hasStock && motif.trim().length > 0 && !stock.loading && !isSubmitting;

  let hint: string | null = null;
  if (!isSlotComplete(slot)) hint = 'Choisissez vos dates de retrait et de restitution.';
  else if (stock.available === 0) hint = 'Aucune unité disponible sur cette période.';
  else if (motif.trim().length === 0) hint = 'Indiquez le motif de votre événement.';

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !start || !end) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await createEquipmentReservation({
        motifEvenement: motif.trim(),
        dateRetrait: start,
        dateRestitution: end,
        lignes: [{ materielId: equipment.id, quantite: quantity }],
      });
      setIsCreated(true);
      window.scrollTo({ top: 0 });
    } catch (err: unknown) {
      logger.error('Réservation du matériel impossible', err);
      setError(err instanceof Error ? err.message : 'Impossible de déposer la demande.');
      if (err instanceof ApiError && err.status === 409) {
        occupancy.refresh();
        setStockVersion((current) => current + 1);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCreated) {
    return (
      <Notice
        tone="success"
        title="Demande envoyée"
        action={
          <div className="flex flex-wrap gap-3">
            <Link href="/historique" className="text-meta font-bold uppercase tracking-label text-primary hover:underline">
              Voir mes démarches
            </Link>
            <Link href="/materiel" className="text-meta font-bold uppercase tracking-label text-ink hover:underline">
              Retour au catalogue
            </Link>
          </div>
        }
      >
        Votre demande pour {quantity} × {equipment.designation} est en attente de validation par la mairie.
      </Notice>
    );
  }

  return (
    <form method="post" onSubmit={submit} className="space-y-8">
      <header>
        <Link
          href="/materiel"
          className="inline-flex items-center gap-1.5 text-meta font-bold uppercase tracking-label text-muted transition-colors hover:text-ink"
        >
          <IconArrowLeft />
          Tout le matériel
        </Link>
        <p className="mt-4 text-label font-bold uppercase tracking-eyebrow text-primary">{getEquipmentCategoryLabel(equipment.categorie)}</p>
        <h1 className="mt-1 text-3xl font-black tracking-display text-ink sm:text-4xl">{equipment.designation}</h1>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-body-sm text-muted">
          <li className="flex items-center gap-1.5">
            <IconMateriel className="h-4 w-4 shrink-0 text-primary" />
            {equipment.stockTotal} unité{equipment.stockTotal > 1 ? 's' : ''} au total
          </li>
          <li className="flex items-center gap-1.5">
            <IconCampagne className="h-4 w-4 shrink-0 text-primary" />
            {equipment.maxConsecutiveDays} jour{equipment.maxConsecutiveDays > 1 ? 's' : ''} d’affilée maximum
          </li>
        </ul>
      </header>

      <EquipmentDetailVisual equipment={equipment} />

      {equipment.description && <p className="max-w-3xl text-body text-ink">{equipment.description}</p>}

      {equipment.consignesUtilisation && (
        <Notice tone="info" title="Consignes d’utilisation">
          {equipment.consignesUtilisation}
        </Notice>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <section aria-labelledby="equipment-period-title" className="rounded-card border border-line bg-white p-5 sm:p-6">
            <h2 id="equipment-period-title" className="text-lg font-black text-ink">
              Vos dates
            </h2>
            <p role="status" className="mt-1 mb-5 text-body-sm text-muted">
              {occupancy.loading && !context
                ? 'Vérification des disponibilités…'
                : 'Touchez le jour de retrait, puis le jour de restitution.'}
            </p>
            {occupancy.failed && (
              <Notice
                tone="danger"
                title="Disponibilités indisponibles"
                action={
                  <Button variant="secondary" size="sm" onClick={occupancy.refresh}>
                    Réessayer
                  </Button>
                }
              >
                Impossible de charger le calendrier de cet équipement.
              </Notice>
            )}
            {context && (
              <SlotPicker slot={slot} context={context} onChange={setRawSlot} startLabel="Retrait" endLabel="Restitution" partialLabel="Stock limité" />
            )}
          </section>

          <section aria-labelledby="equipment-request-title" className="space-y-5 rounded-card border border-line bg-white p-5 sm:p-6">
            <h2 id="equipment-request-title" className="text-lg font-black text-ink">
              Votre demande
            </h2>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div role="status">
                <p className={fieldLabelVariants()}>Quantité</p>
                <p className="mt-1 text-body-sm text-muted">
                  {!isSlotComplete(slot) && 'Choisissez d’abord vos dates.'}
                  {stock.loading && 'Vérification du stock…'}
                  {stock.failed && 'Stock impossible à vérifier.'}
                  {stock.available !== null && `${stock.available} disponible${stock.available > 1 ? 's' : ''} sur cette période`}
                </p>
              </div>
              {hasStock && <EquipmentQuantitySelector quantity={quantity} maximum={maximum} onChange={setRequestedQuantity} />}
            </div>

            <div>
              <label htmlFor={motifId} className={fieldLabelVariants()}>
                Motif de l’événement *
              </label>
              <textarea
                id={motifId}
                required
                rows={3}
                value={motif}
                placeholder="Ex : fête de quartier, assemblée générale…"
                onChange={(event) => setMotif(event.target.value)}
                className={fieldControlVariants()}
              />
            </div>
          </section>
        </div>

        <EquipmentReservationRecap
          slot={slot}
          quantity={quantity}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          error={error}
          hint={hint}
        />
      </div>
    </form>
  );
}
