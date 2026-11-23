'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { fieldControlVariants } from '@/components/admin/campaign/fieldStyles';
import SettingsCard from '@/components/admin/settings/SettingsCard';
import SettingsField, { fieldA11y } from '@/components/admin/settings/SettingsField';
import SettingsSaveBar from '@/components/admin/settings/SettingsSaveBar';
import Notice from '@/components/ui/Notice';
import { getRoomSettings, settingsFieldErrors, updateRoomSettings } from '@/lib/api';
import type { RoomSettings } from '@/lib/api/types';
import { logger } from '@/lib/logger';
import { clearFieldError, HOURS, formatHour, roomDraft, validateRoomDraft, type FieldErrors, type RoomSettingsDraft } from '@/lib/settingsForm';

type Feedback = { tone: 'success' | 'danger'; message: string } | null;

/** Horaires d'ouverture des salles et durée des réservations ponctuelles. */
export default function RoomSettingsPanel() {
  const [settings, setSettings] = useState<RoomSettings | null>(null);
  const [draft, setDraft] = useState<RoomSettingsDraft | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    let active = true;
    getRoomSettings()
      .then((data) => {
        if (!active) return;
        setSettings(data);
        setDraft(roomDraft(data));
      })
      .catch((error: unknown) => {
        logger.error('Chargement des réglages des salles impossible', error);
        if (active) setFeedback({ tone: 'danger', message: 'Impossible de charger les réglages des salles.' });
      });
    return () => {
      active = false;
    };
  }, []);

  if (!settings || !draft) {
    return feedback ? <Notice tone="danger">{feedback.message}</Notice> : <p className="text-body-sm text-muted" role="status">Chargement des réglages…</p>;
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(roomDraft(settings));
  const change = (field: keyof RoomSettingsDraft, value: string) => {
    setDraft({ ...draft, [field]: value });
    setErrors((current) => clearFieldError(current, field));
    setFeedback(null);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || !settings) return;
    const { errors: localErrors, input } = validateRoomDraft(draft, settings.limits.oneOffMaxDays);
    setErrors(localErrors);
    if (!input) return;

    setSaving(true);
    try {
      const saved = await updateRoomSettings(input);
      setSettings(saved);
      setDraft(roomDraft(saved));
      setFeedback({ tone: 'success', message: 'Réglages des salles enregistrés. Ils s’appliquent aux nouvelles demandes.' });
    } catch (error) {
      const serverErrors = settingsFieldErrors(error);
      setErrors(serverErrors);
      if (Object.keys(serverErrors).length === 0) {
        logger.error('Enregistrement des réglages des salles impossible', error);
        setFeedback({ tone: 'danger', message: 'L’enregistrement a échoué. Réessayez dans un instant.' });
      }
    } finally {
      setSaving(false);
    }
  }

  const reset = () => {
    setDraft(roomDraft(settings));
    setErrors({});
    setFeedback(null);
  };

  return (
    <div className="space-y-4">
      {feedback && <Notice tone={feedback.tone}>{feedback.message}</Notice>}

      <SettingsCard
        title="Ouverture des salles"
        description="Les créneaux proposés aux associations, en réservation ponctuelle comme en campagne, restent dans ces horaires."
        onSubmit={(event) => void handleSubmit(event)}
        footer={<SettingsSaveBar updatedAt={settings.updatedAt} updatedBy={settings.updatedBy} dirty={dirty} saving={saving} onReset={reset} />}
      >
        <div className="grid gap-5 sm:grid-cols-3">
          <SettingsField id="room-opening" label="Ouverture" error={errors.openingHour}>
            <select
              {...fieldA11y('room-opening', errors.openingHour)}
              value={draft.openingHour}
              onChange={(event) => change('openingHour', event.target.value)}
              className={fieldControlVariants({ invalid: Boolean(errors.openingHour) })}
            >
              {HOURS.slice(0, 24).map((hour) => (
                <option key={hour} value={hour}>
                  {formatHour(hour)}
                </option>
              ))}
            </select>
          </SettingsField>

          <SettingsField id="room-closing" label="Fermeture" error={errors.closingHour}>
            <select
              {...fieldA11y('room-closing', errors.closingHour)}
              value={draft.closingHour}
              onChange={(event) => change('closingHour', event.target.value)}
              className={fieldControlVariants({ invalid: Boolean(errors.closingHour) })}
            >
              {HOURS.slice(1).map((hour) => (
                <option key={hour} value={hour}>
                  {hour === 24 ? 'Minuit' : formatHour(hour)}
                </option>
              ))}
            </select>
          </SettingsField>

          <SettingsField
            id="room-max-days"
            label="Réservation ponctuelle"
            hint={`Jours consécutifs au maximum (1 à ${settings.limits.oneOffMaxDays}).`}
            error={errors.oneOffMaxDays}
          >
            <input
              {...fieldA11y('room-max-days', errors.oneOffMaxDays, true)}
              type="number"
              inputMode="numeric"
              min={1}
              max={settings.limits.oneOffMaxDays}
              value={draft.oneOffMaxDays}
              onChange={(event) => change('oneOffMaxDays', event.target.value)}
              className={fieldControlVariants({ invalid: Boolean(errors.oneOffMaxDays) })}
            />
          </SettingsField>
        </div>
      </SettingsCard>
    </div>
  );
}
