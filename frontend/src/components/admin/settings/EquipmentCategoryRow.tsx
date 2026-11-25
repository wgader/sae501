'use client';

import { useState, type FormEvent } from 'react';
import { fieldControlVariants, fieldHintVariants } from '@/components/admin/campaign/fieldStyles';
import Button from '@/components/ui/Button';
import { IconEdit, IconTrash } from '@/components/ui/icons';
import type { AdminEquipmentCategory } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface EquipmentCategoryRowProps {
  category: AdminEquipmentCategory;
  busy: boolean;
  /** Renvoie le message d'erreur du serveur, ou null si le renommage a réussi. */
  onRename: (category: AdminEquipmentCategory, label: string) => Promise<string | null>;
  onDelete: (category: AdminEquipmentCategory) => void;
}

const LABEL_MAX_LENGTH = 100;

/** Une catégorie : nom, nombre d'équipements, renommage sur place et suppression. */
export default function EquipmentCategoryRow({ category, busy, onRename, onDelete }: EquipmentCategoryRowProps) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(category.label);
  const [error, setError] = useState<string | null>(null);
  const inputId = `category-${category.id}`;
  const inUse = category.equipmentCount > 0;
  const countLabel = inUse
    ? `${category.equipmentCount} équipement${category.equipmentCount > 1 ? 's' : ''}`
    : 'Aucun équipement';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (label.trim() === '') {
      setError('Le nom est obligatoire.');
      return;
    }
    if (label.trim() === category.label) {
      setEditing(false);
      return;
    }
    const serverError = await onRename(category, label);
    setError(serverError);
    if (!serverError) setEditing(false);
  }

  if (editing) {
    return (
      <li className="px-1 py-3">
        <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex-1">
            <label htmlFor={inputId} className="sr-only">
              Nouveau nom de « {category.label} »
            </label>
            <input
              id={inputId}
              autoFocus
              value={label}
              maxLength={LABEL_MAX_LENGTH}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${inputId}-error` : undefined}
              onChange={(event) => {
                setLabel(event.target.value);
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Escape') return;
                setLabel(category.label);
                setEditing(false);
              }}
              className={cn(fieldControlVariants({ invalid: Boolean(error) }), 'mt-0 py-2')}
            />
            {error && (
              <p id={`${inputId}-error`} className={fieldHintVariants({ tone: 'danger' })}>
                {error}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy}>
              Enregistrer
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setLabel(category.label);
                setError(null);
                setEditing(false);
              }}
            >
              Annuler
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 px-1 py-3">
      <div className="min-w-0">
        <p className="truncate text-body-sm font-bold text-ink">{category.label}</p>
        <p className="text-meta text-muted">{countLabel}</p>
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={busy}
          aria-label={`Renommer « ${category.label} »`}
          className="cursor-pointer rounded-soft p-2 text-muted transition-colors hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          <IconEdit />
        </button>
        <button
          type="button"
          onClick={() => onDelete(category)}
          disabled={busy || inUse}
          aria-label={inUse ? `« ${category.label} » contient ${countLabel} : suppression impossible` : `Supprimer « ${category.label} »`}
          title={inUse ? 'Reclassez d’abord les équipements de cette catégorie.' : undefined}
          className="cursor-pointer rounded-soft p-2 text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted"
        >
          <IconTrash />
        </button>
      </div>
    </li>
  );
}
