'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Notice from '@/components/ui/Notice';
import { IconArrowLeft, IconArrowRight, IconPlus } from '@/components/ui/icons';
import WishLineEditor from '@/components/campaign/wishes/WishLineEditor';
import WishSummaryTable, { type WishSummaryRow } from '@/components/campaign/wishes/WishSummaryTable';
import { CampaignWishSubmitError, getPublicRooms, submitCampaignWishes, type Campaign, type CampaignWishSubmission, type PublicRoom } from '@/lib/api';
import { formatInstant } from '@/lib/campaignDates';
import {
  MAX_WISHES,
  WISH_AUDIENCES,
  WISH_DAYS,
  WISH_FREQUENCIES,
  emptyWish,
  labelOf,
  overlappingWishes,
  toWishInput,
  validateWish,
  type WishDraft,
  type WishErrors,
  type WishField,
} from '@/lib/campaignWishes';
import { logger } from '@/lib/logger';
import { useRoomBookingRules } from '@/hooks/useRoomBookingRules';

type Step = 'edit' | 'recap' | 'done';

interface CampaignWishWizardProps {
  campaign: Campaign;
  onSubmitted: () => void;
  /** La campagne s'est fermée pendant la saisie : la page passe en lecture seule. */
  onClosed: () => void;
}

/** Dépôt des vœux en trois temps : saisie des créneaux, récapitulatif, confirmation. */
export default function CampaignWishWizard({ campaign, onSubmitted, onClosed }: CampaignWishWizardProps) {
  const [step, setStep] = useState<Step>('edit');
  const [wishes, setWishes] = useState<WishDraft[]>(() => [emptyWish()]);
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, WishErrors>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<CampaignWishSubmission | null>(null);
  const { rules: roomRules } = useRoomBookingRules();

  useEffect(() => {
    let active = true;
    getPublicRooms()
      .then((items) => active && setRooms(items))
      .catch((loadError) => {
        logger.error('Chargement des salles impossible', loadError);
        if (active) setError('Impossible de charger la liste des salles.');
      });
    return () => {
      active = false;
    };
  }, []);

  const errors = useMemo(
    () => Object.fromEntries(wishes.map((wish) => [
      wish.key,
      { ...validateWish(wish, rooms, campaign.periodStart, campaign.periodEnd), ...serverErrors[wish.key] },
    ])),
    [wishes, rooms, serverErrors, campaign.periodStart, campaign.periodEnd],
  );
  const overlaps = useMemo(() => overlappingWishes(wishes), [wishes]);
  const hasErrors = overlaps.size > 0 || Object.values(errors).some((wishErrors) => Object.keys(wishErrors).length > 0);

  const update = (key: string, field: WishField, value: string) => {
    setWishes((current) => current.map((wish) => (wish.key === key ? { ...wish, [field]: value } : wish)));
    setServerErrors((current) => ({ ...current, [key]: {} }));
  };

  const goToRecap = () => {
    setShowErrors(true);
    if (!hasErrors) {
      setError('');
      setStep('recap');
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      setSubmitted(await submitCampaignWishes(wishes.map(toWishInput)));
      setStep('done');
      onSubmitted();
    } catch (submitError) {
      logger.error('Transmission des vœux impossible', submitError);
      if (submitError instanceof CampaignWishSubmitError && submitError.closed) {
        setError('La période de dépôt est désormais expirée : vos vœux n’ont pas été transmis.');
        onClosed();
      } else if (submitError instanceof CampaignWishSubmitError && submitError.errors.length > 0) {
        const byKey: Record<string, WishErrors> = {};
        submitError.errors.forEach(({ line, field, message }) => {
          const wish = line ? wishes[line - 1] : undefined;
          if (wish && field) byKey[wish.key] = { ...byKey[wish.key], [field]: message.replace(/^Vœu \d+ : /, '') };
        });
        setServerErrors(byKey);
        setError(submitError.message);
        setShowErrors(true);
        setStep('edit');
      } else {
        setError(submitError instanceof Error ? submitError.message : 'Impossible de transmettre vos vœux.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const draftRows: WishSummaryRow[] = wishes.map((wish) => ({
    key: wish.key,
    salle: rooms.find((room) => String(room.id) === wish.salleId)?.nom ?? '',
    day: labelOf(WISH_DAYS, wish.dayOfWeek),
    hours: `${wish.startTime} – ${wish.endTime}`,
    frequency: labelOf(WISH_FREQUENCIES, wish.frequency),
    activity: wish.activity.trim(),
    audience: labelOf(WISH_AUDIENCES, wish.audience),
    attendance: Number(wish.expectedAttendance),
  }));

  if (step === 'done' && submitted) {
    return (
      <section aria-labelledby="wishes-done-title" className="space-y-5">
        <Notice tone="success" title="Vœux transmis à la mairie">
          Votre dossier est enregistré le {formatInstant(submitted.submittedAt)}. Ses {submitted.wishes.length} vœu
          {submitted.wishes.length > 1 ? 'x sont' : ' est'} en attente d’arbitrage par la mairie, et un accusé de réception
          vous a été envoyé par e-mail.
        </Notice>
        <h3 id="wishes-done-title" className="sr-only">Synthèse des vœux transmis</h3>
        <WishSummaryTable rows={draftRows} caption="Vœux transmis" />
        <Button variant="secondary" onClick={() => { setWishes([emptyWish()]); setShowErrors(false); setSubmitted(null); setStep('edit'); }}>
          Déposer d’autres vœux
        </Button>
      </section>
    );
  }

  return (
    <section aria-labelledby="wishes-form-title" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-label font-bold uppercase tracking-label text-muted">
            Étape {step === 'edit' ? '1' : '2'} sur 2
          </p>
          <h2 id="wishes-form-title" className="text-lg font-black text-ink sm:text-xl">
            {step === 'edit' ? 'Vos créneaux réguliers' : 'Vérifiez vos vœux'}
          </h2>
        </div>
        {campaign.closingAt && (
          <p className="text-meta font-bold text-muted">Date limite : {formatInstant(campaign.closingAt)}</p>
        )}
      </div>

      {error && <Notice tone="danger">{error}</Notice>}

      {step === 'edit' ? (
        <>
          <div className="space-y-4">
            {wishes.map((wish, index) => (
              <WishLineEditor
                key={wish.key}
                index={index}
                wish={wish}
                rooms={rooms}
                errors={errors[wish.key] ?? {}}
                overlaps={overlaps.has(wish.key)}
                showErrors={showErrors}
                canRemove={wishes.length > 1}
                periodStart={campaign.periodStart ?? null}
                periodEnd={campaign.periodEnd ?? null}
                roomRules={roomRules}
                onChange={(field, value) => update(wish.key, field, value)}
                onRemove={() => setWishes((current) => current.filter((item) => item.key !== wish.key))}
              />
            ))}
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-between">
            <Button
              variant="secondary"
              disabled={wishes.length >= MAX_WISHES}
              onClick={() => setWishes((current) => [...current, emptyWish()])}
              leftIcon={<IconPlus className="h-4 w-4" />}
            >
              Ajouter un vœu
            </Button>
            <Button onClick={goToRecap} disabled={showErrors && hasErrors} rightIcon={<IconArrowRight className="h-4 w-4" />}>
              Vérifier mes vœux
            </Button>
          </div>
        </>
      ) : (
        <>
          <WishSummaryTable rows={draftRows} caption="Récapitulatif des vœux avant envoi" />
          <p className="text-body-sm text-muted">
            Une fois transmis, vos vœux ne sont plus modifiables : la mairie les arbitre avec ceux des autres associations.
          </p>
          <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-between">
            <Button variant="secondary" onClick={() => setStep('edit')} disabled={submitting} leftIcon={<IconArrowLeft className="h-4 w-4" />}>
              Modifier
            </Button>
            <Button onClick={() => void submit()} isLoading={submitting}>
              Transmettre mes {wishes.length} vœu{wishes.length > 1 ? 'x' : ''}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
