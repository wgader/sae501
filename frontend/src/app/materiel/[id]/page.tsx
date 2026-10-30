'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import EquipmentDetailVisual from '@/components/equipment/EquipmentDetailVisual';
import EquipmentQuantitySelector from '@/components/equipment/EquipmentQuantitySelector';
import ReservationDateRange from '@/components/equipment/ReservationDateRange';
import ReservationSummary from '@/components/equipment/ReservationSummary';
import RequestSuccessModal from '@/components/ui/RequestSuccessModal';
import {
  ApiError,
  Equipment,
  EquipmentAvailability,
  createEquipmentReservation,
  getEquipmentAvailability,
  getPublicEquipment,
} from '@/lib/api';

function toIsoDate(value: string): string {
  return new Date(value).toISOString();
}

export default function EquipmentReservationPage() {
  const params = useParams<{ id: string }>();
  const equipmentId = Number(params.id);
  const invalidEquipmentId = !Number.isInteger(equipmentId) || equipmentId <= 0;
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [availability, setAvailability] = useState<EquipmentAvailability | null>(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [motif, setMotif] = useState('');
  const [loading, setLoading] = useState(true);
  const [availabilityKey, setAvailabilityKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (invalidEquipmentId) return;

    getPublicEquipment()
      .then((items) => {
        const found = items.find((item) => item.id === equipmentId);
        if (!found) {
          setError('Équipement introuvable.');
          return;
        }
        setEquipment(found);
      })
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : 'Impossible de charger cet équipement.');
      })
      .finally(() => setLoading(false));
  }, [equipmentId, invalidEquipmentId]);

  const periodIsValid = useMemo(() => {
    if (!start || !end) return false;
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    return !Number.isNaN(startDate.getTime()) &&
      !Number.isNaN(endDate.getTime()) &&
      startDate >= now &&
      endDate > startDate;
  }, [start, end]);

  useEffect(() => {
    if (!periodIsValid || !equipment) return;

    let active = true;

    getEquipmentAvailability(toIsoDate(start), toIsoDate(end))
      .then((result) => {
        if (!active) return;
        const current = result.items.find((item) => item.id === equipment.id) ?? null;
        setAvailability(current);
        setAvailabilityKey(`${start}|${end}`);
        if (!current) {
          setError('Impossible de trouver la disponibilité de cet équipement pour cette période.');
        }
        if (current) setQuantity((previous) => Math.min(previous, Math.max(1, current.stockDisponible)));
      })
      .catch((requestError: unknown) => {
        if (active) {
          setAvailability(null);
          setAvailabilityKey(`${start}|${end}`);
          setError(requestError instanceof ApiError ? requestError.message : 'Impossible de vérifier le stock.');
        }
      });

    return () => {
      active = false;
    };
  }, [equipment, end, periodIsValid, start]);

  function handleStartChange(value: string) {
    setStart(value);
    setAvailability(null);
    setAvailabilityKey('');
    setError('');
    setSuccess('');
  }

  function handleEndChange(value: string) {
    setEnd(value);
    setAvailability(null);
    setAvailabilityKey('');
    setError('');
    setSuccess('');
  }

  async function handleSubmit() {
    if (!equipment || !availability || !periodIsValid || !motif.trim() || quantity > availability.stockDisponible) {
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await createEquipmentReservation({
        motifEvenement: motif.trim(),
        dateRetrait: toIsoDate(start),
        dateRestitution: toIsoDate(end),
        lignes: [{ materielId: equipment.id, quantite: quantity }],
      });
      setSuccess('Votre demande a bien été déposée et est en attente de validation par la mairie.');
    } catch (requestError: unknown) {
      setError(requestError instanceof ApiError ? requestError.message : 'Impossible de déposer la demande.');
    } finally {
      setSubmitting(false);
    }
  }

  if (invalidEquipmentId) {
    return (
      <main className="p-10 text-center">
        <p className="font-semibold text-danger">Équipement introuvable.</p>
        <Link href="/materiel" className="mt-4 inline-block text-sm font-bold text-primary hover:underline">
          Retour au catalogue
        </Link>
      </main>
    );
  }

  if (loading) {
    return <main className="p-10 text-center text-sm text-muted">Chargement de l&apos;équipement...</main>;
  }

  if (!equipment) {
    return (
      <main className="p-10 text-center">
        <p className="font-semibold text-danger">{error || 'Équipement introuvable.'}</p>
        <Link href="/materiel" className="mt-4 inline-block text-sm font-bold text-primary hover:underline">
          Retour au catalogue
        </Link>
      </main>
    );
  }

  const currentAvailability =
    periodIsValid && availabilityKey === `${start}|${end}` ? availability : null;
  const checkingAvailability = periodIsValid && currentAvailability === null && !error;
  const maximum = currentAvailability?.stockDisponible ?? 0;
  const canSubmit = Boolean(
    currentAvailability &&
      periodIsValid &&
      motif.trim() &&
      quantity > 0 &&
      quantity <= maximum &&
      !checkingAvailability &&
      !submitting,
  );

  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/materiel" className="text-xs font-bold uppercase tracking-label text-muted hover:text-primary">
          ← Retour au catalogue
        </Link>
        <header className="mt-6 border-b border-line pb-6">
          <p className="text-label font-bold uppercase tracking-eyebrow text-primary">Demande de matériel</p>
          <h1 className="mt-2 text-4xl font-black tracking-display text-ink sm:text-5xl">
            Réserver le matériel
          </h1>
          <p className="mt-2 text-sm text-muted">{equipment.designation}</p>
        </header>

        <div className="mt-8 grid overflow-hidden border border-line bg-white shadow-xs lg:grid-cols-2">
          <section className="flex flex-col bg-paper">
            <EquipmentDetailVisual equipment={equipment} />
            <div className="flex-1 p-6 sm:p-8">
              <p className="text-label font-bold uppercase tracking-eyebrow text-primary">
                {equipment.categorie}
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-display text-ink">
                {equipment.designation}
              </h2>
              <span className="mt-3 inline-flex rounded-pill bg-accent px-3 py-1 text-caption font-bold text-ink">
                {currentAvailability?.stockDisponible ?? equipment.stockTotal} unités disponibles
              </span>
              <p className="mt-5 max-w-xl text-sm leading-6 text-muted">
                {equipment.description || 'Sélectionnez une période pour vérifier la disponibilité de cet équipement.'}
              </p>
              <div className="mt-6 grid gap-4 border-t border-line pt-5 text-xs sm:grid-cols-3">
                <div>
                  <p className="font-bold uppercase tracking-label text-muted">Stock catalogue</p>
                  <p className="mt-1 font-semibold text-ink">{equipment.stockTotal} unités</p>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-label text-muted">Retrait</p>
                  <p className="mt-1 font-semibold text-ink">Services techniques municipaux</p>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-label text-muted">État</p>
                  <p className="mt-1 font-semibold text-ink">Réservation soumise à validation</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6 border-t border-line bg-white p-6 sm:p-8 lg:border-l lg:border-t-0">
            <ReservationDateRange
              start={start}
              end={end}
              onStartChange={handleStartChange}
              onEndChange={handleEndChange}
            />

            {periodIsValid && (
              <div className="border-t border-line pt-6">
                <p className="text-xs font-bold uppercase tracking-label text-ink">Quantité souhaitée</p>
                {checkingAvailability ? (
                  <p className="mt-3 text-sm text-muted" role="status">Vérification du stock...</p>
                ) : currentAvailability && currentAvailability.stockDisponible > 0 ? (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-muted">Maximum : {currentAvailability.stockDisponible}</span>
                    <EquipmentQuantitySelector
                      quantity={quantity}
                      maximum={currentAvailability.stockDisponible}
                      onChange={setQuantity}
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-sm font-semibold text-danger" role="alert">
                    Aucun stock disponible sur cette période.
                  </p>
                )}
              </div>
            )}

            {currentAvailability && currentAvailability.stockDisponible > 0 && (
              <ReservationSummary
                equipment={currentAvailability}
                quantity={quantity}
                motif={motif}
                onMotifChange={setMotif}
              />
            )}

            {currentAvailability && currentAvailability.stockDisponible > 0 && !motif.trim() && (
              <p className="text-sm text-muted" role="status">
                Indiquez le motif de votre événement pour valider la demande.
              </p>
            )}
            {error && <p className="rounded-control bg-red-50 px-4 py-3 text-sm font-semibold text-danger" role="alert">{error}</p>}
            {success && (
              <p className="rounded-control bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">
                {success}
              </p>
            )}

            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={!canSubmit}
              isLoading={submitting}
              onClick={handleSubmit}
              rightIcon={<span aria-hidden="true">→</span>}
            >
              Valider la demande
            </Button>
          </section>
        </div>
      </div>
      <RequestSuccessModal
        isOpen={Boolean(success)}
        onClose={() => setSuccess('')}
      />
    </main>
  );
}
