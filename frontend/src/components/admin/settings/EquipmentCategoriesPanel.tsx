'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { fieldControlVariants, fieldHintVariants } from '@/components/admin/campaign/fieldStyles';
import EquipmentCategoryRow from '@/components/admin/settings/EquipmentCategoryRow';
import SettingsCard from '@/components/admin/settings/SettingsCard';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Notice from '@/components/ui/Notice';
import { IconPlus } from '@/components/ui/icons';
import {
  ApiError,
  createEquipmentCategory,
  deleteEquipmentCategory,
  getAdminEquipmentCategories,
  renameEquipmentCategory,
  settingsFieldErrors,
} from '@/lib/api';
import type { AdminEquipmentCategory } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

type Feedback = { tone: 'success' | 'danger'; message: string } | null;

const byLabel = (a: AdminEquipmentCategory, b: AdminEquipmentCategory) => a.label.localeCompare(b.label, 'fr');

function errorMessage(error: unknown, fallback: string): string {
  const fields = settingsFieldErrors(error);
  if (fields.label) return fields.label;
  if (error instanceof ApiError && error.status !== 500) return error.message;
  return fallback;
}

/** Catégories du catalogue : ajout, renommage, suppression des catégories vides. */
export default function EquipmentCategoriesPanel() {
  const [categories, setCategories] = useState<AdminEquipmentCategory[] | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminEquipmentCategory | null>(null);

  useEffect(() => {
    let active = true;
    getAdminEquipmentCategories()
      .then((data) => {
        if (active) setCategories(data);
      })
      .catch((error: unknown) => {
        logger.error('Chargement des catégories impossible', error);
        if (active) setFeedback({ tone: 'danger', message: 'Impossible de charger les catégories.' });
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newLabel.trim() === '') {
      setAddError('Donnez un nom à la catégorie.');
      return;
    }
    setBusy(true);
    try {
      const created = await createEquipmentCategory(newLabel);
      setCategories((current) => [...(current ?? []), created].sort(byLabel));
      setNewLabel('');
      setFeedback({ tone: 'success', message: `Catégorie « ${created.label} » ajoutée.` });
    } catch (error) {
      logger.warn('Ajout de catégorie refusé', error);
      setAddError(errorMessage(error, 'L’ajout a échoué. Réessayez dans un instant.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleRename(category: AdminEquipmentCategory, label: string): Promise<string | null> {
    setBusy(true);
    try {
      const renamed = await renameEquipmentCategory(category.id, label);
      setCategories((current) => (current ?? []).map((item) => (item.id === renamed.id ? renamed : item)).sort(byLabel));
      setFeedback({ tone: 'success', message: `Catégorie renommée en « ${renamed.label} ».` });
      return null;
    } catch (error) {
      logger.warn('Renommage de catégorie refusé', error);
      return errorMessage(error, 'Le renommage a échoué. Réessayez dans un instant.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const category = pendingDelete;
    setBusy(true);
    try {
      await deleteEquipmentCategory(category.id);
      setCategories((current) => (current ?? []).filter((item) => item.id !== category.id));
      setFeedback({ tone: 'success', message: `Catégorie « ${category.label} » supprimée.` });
    } catch (error) {
      logger.warn('Suppression de catégorie refusée', error);
      setFeedback({ tone: 'danger', message: errorMessage(error, 'La suppression a échoué. Réessayez dans un instant.') });
    } finally {
      setBusy(false);
      setPendingDelete(null);
    }
  }

  const count = categories?.length ?? 0;

  return (
    <SettingsCard
      title="Catégories du catalogue"
      description="Elles classent le matériel et servent de filtres aux associations. Une catégorie qui contient encore du matériel ne peut pas être supprimée."
    >
      <div className="space-y-4">
        {feedback && <Notice tone={feedback.tone}>{feedback.message}</Notice>}

        <form onSubmit={(event) => void handleAdd(event)} noValidate className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex-1">
            <label htmlFor="new-category" className="sr-only">
              Nom de la nouvelle catégorie
            </label>
            <input
              id="new-category"
              value={newLabel}
              maxLength={100}
              placeholder="Nouvelle catégorie, ex. : Jeux de plein air"
              aria-invalid={addError ? true : undefined}
              aria-describedby={addError ? 'new-category-error' : undefined}
              onChange={(event) => {
                setNewLabel(event.target.value);
                setAddError(null);
              }}
              className={cn(fieldControlVariants({ invalid: Boolean(addError) }), 'mt-0')}
            />
            {addError && (
              <p id="new-category-error" className={fieldHintVariants({ tone: 'danger' })}>
                {addError}
              </p>
            )}
          </div>
          <Button type="submit" disabled={busy}>
            <span className="inline-flex items-center gap-2">
              <IconPlus />
              Ajouter
            </span>
          </Button>
        </form>

        {categories === null && !feedback && (
          <p className="text-body-sm text-muted" role="status">
            Chargement des catégories…
          </p>
        )}

        {categories && (
          <>
            <p className="text-meta font-bold uppercase tracking-label text-muted">
              {count} catégorie{count > 1 ? 's' : ''}
            </p>
            <ul className="max-h-planning-viewport divide-y divide-line overflow-y-auto rounded-soft border border-line px-3">
              {categories.map((category) => (
                <EquipmentCategoryRow
                  key={category.id}
                  category={category}
                  busy={busy}
                  onRename={handleRename}
                  onDelete={setPendingDelete}
                />
              ))}
            </ul>
          </>
        )}
      </div>

      <Dialog
        open={pendingDelete !== null}
        size="sm"
        title="Supprimer la catégorie ?"
        description={pendingDelete ? `« ${pendingDelete.label} » disparaîtra du catalogue et des filtres.` : undefined}
        onClose={() => setPendingDelete(null)}
        footer={
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => setPendingDelete(null)}>
              Annuler
            </Button>
            <Button type="button" variant="danger" size="sm" disabled={busy} onClick={() => void confirmDelete()}>
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-muted">Aucun équipement n’y est rattaché. Vous pourrez la recréer plus tard si besoin.</p>
      </Dialog>
    </SettingsCard>
  );
}
