'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { fieldControlVariants } from '@/components/admin/campaign/fieldStyles';
import SettingsCard from '@/components/admin/settings/SettingsCard';
import SettingsField, { fieldA11y } from '@/components/admin/settings/SettingsField';
import SettingsSaveBar from '@/components/admin/settings/SettingsSaveBar';
import Notice from '@/components/ui/Notice';
import { getEquipmentSettings, settingsFieldErrors, updateEquipmentSettings } from '@/lib/api';
import type { EquipmentSettings } from '@/lib/api/types';
import { logger } from '@/lib/logger';
import { clearFieldError, equipmentDraft, validateEquipmentDraft, type EquipmentSettingsDraft, type FieldErrors } from '@/lib/settingsForm';

type Feedback = { tone: 'success' | 'danger'; message: string } | null;

/** Service de prêt : horaires et lieu de retrait, limites des demandes. */
export default function EquipmentSettingsPanel() {
  const [settings, setSettings] = useState<EquipmentSettings | null>(null);
  const [draft, setDraft] = useState<EquipmentSettingsDraft | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    let active = true;
    getEquipmentSettings()
      .then((data) => {
        if (!active) return;
        setSettings(data);
        setDraft(equipmentDraft(data));
      })
      .catch((error: unknown) => {
        logger.error('Chargement des réglages du matériel impossible', error);
        if (active) setFeedback({ tone: 'danger', message: 'Impossible de charger les réglages du matériel.' });
      });
    return () => {
      active = false;
    };
  }, []);

  if (!settings || !draft) {
    return feedback ? <Notice tone="danger">{feedback.message}</Notice> : <p className="text-body-sm text-muted" role="status">Chargement des réglages…</p>;
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(equipmentDraft(settings));
  const change = (field: keyof EquipmentSettingsDraft, value: string) => {
    setDraft({ ...draft, [field]: value });
    setErrors((current) => clearFieldError(current, field));
    setFeedback(null);
  };
  const control = (field: keyof EquipmentSettingsDraft) => ({
    value: draft[field],
    onChange: (event: { target: { value: string } }) => change(field, event.target.value),
    className: fieldControlVariants({ invalid: Boolean(errors[field]) }),
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || !settings) return;
    const { errors: localErrors, input } = validateEquipmentDraft(draft, settings.limits);
    setErrors(localErrors);
    if (!input) return;

    setSaving(true);
    try {
      const saved = await updateEquipmentSettings(input);
      setSettings(saved);
      setDraft(equipmentDraft(saved));
      setFeedback({ tone: 'success', message: 'Réglages du matériel enregistrés. Ils s’appliquent aux nouvelles demandes.' });
    } catch (error) {
      const serverErrors = settingsFieldErrors(error);
      setErrors(serverErrors);
      if (Object.keys(serverErrors).length === 0) {
        logger.error('Enregistrement des réglages du matériel impossible', error);
        setFeedback({ tone: 'danger', message: 'L’enregistrement a échoué. Réessayez dans un instant.' });
      }
    } finally {
      setSaving(false);
    }
  }

  const reset = () => {
    setDraft(equipmentDraft(settings));
    setErrors({});
    setFeedback(null);
  };

  return (
    <div className="space-y-4">
      {feedback && <Notice tone={feedback.tone}>{feedback.message}</Notice>}

      <SettingsCard
        title="Service de prêt"
        description="Le retrait et la restitution du matériel se font dans ces horaires. Le calendrier des associations ne propose rien en dehors."
        onSubmit={(event) => void handleSubmit(event)}
        footer={<SettingsSaveBar updatedAt={settings.updatedAt} updatedBy={settings.updatedBy} dirty={dirty} saving={saving} onReset={reset} />}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <SettingsField id="desk-opening" label="Ouverture du service" error={errors.deskOpening}>
            <input {...fieldA11y('desk-opening', errors.deskOpening)} type="time" step={1800} required {...control('deskOpening')} />
          </SettingsField>
          <SettingsField id="desk-closing" label="Fermeture du service" error={errors.deskClosing}>
            <input {...fieldA11y('desk-closing', errors.deskClosing)} type="time" step={1800} required {...control('deskClosing')} />
          </SettingsField>

          <div className="sm:col-span-2">
            <SettingsField
              id="pickup-location"
              label="Lieu de retrait et de restitution"
              hint="Affiché aux associations au moment de la demande. Facultatif."
              error={errors.pickupLocation}
            >
              <input
                {...fieldA11y('pickup-location', errors.pickupLocation, true)}
                type="text"
                maxLength={settings.limits.pickupLocation}
                placeholder="Ex. : Centre technique municipal, 12 rue des Écoles"
                {...control('pickupLocation')}
              />
            </SettingsField>
          </div>

          <SettingsField
            id="max-quantity"
            label="Quantité maximale par demande"
            hint="Pour un même équipement. Laissez vide : seul le stock limite."
            error={errors.maxQuantityPerRequest}
          >
            <input
              {...fieldA11y('max-quantity', errors.maxQuantityPerRequest, true)}
              type="number"
              inputMode="numeric"
              min={1}
              max={settings.limits.maxQuantityPerRequest}
              placeholder="Sans limite"
              {...control('maxQuantityPerRequest')}
            />
          </SettingsField>

          <SettingsField
            id="default-days"
            label="Durée de prêt par défaut"
            hint="Jours consécutifs, appliqués aux nouveaux équipements. Modifiable ensuite pour chacun."
            error={errors.defaultMaxDays}
          >
            <input
              {...fieldA11y('default-days', errors.defaultMaxDays, true)}
              type="number"
              inputMode="numeric"
              min={1}
              max={settings.limits.defaultMaxDays}
              {...control('defaultMaxDays')}
            />
          </SettingsField>
        </div>
      </SettingsCard>
    </div>
  );
}
