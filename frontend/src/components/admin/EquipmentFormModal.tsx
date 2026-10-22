'use client';

import { useState, type FormEvent } from 'react';
import {
  ApiError,
  createAdminEquipment,
  Equipment,
  updateAdminEquipment,
} from '@/lib/api';

interface EquipmentFormModalProps {
  isOpen: boolean;
  editingItem: Equipment | null;
  onClose: () => void;
  onSaved: (equipment: Equipment, wasEditing: boolean) => void;
  onError: (message: string) => void;
}

const DEFAULT_CATEGORY = 'mobilier';
const DEFAULT_STOCK = 10;

export default function EquipmentFormModal({
  isOpen,
  editingItem,
  onClose,
  onSaved,
  onError,
}: EquipmentFormModalProps) {
  const [designation, setDesignation] = useState(editingItem?.designation ?? '');
  const [category, setCategory] = useState(editingItem?.categorie ?? DEFAULT_CATEGORY);
  const [reference, setReference] = useState(editingItem?.referenceInterne ?? '');
  const [description, setDescription] = useState(editingItem?.description ?? '');
  const [instructions, setInstructions] = useState(editingItem?.consignesUtilisation ?? '');
  const [stock, setStock] = useState<number | ''>(editingItem?.stockTotal ?? DEFAULT_STOCK);
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors: Record<string, string> = {};
    if (!designation.trim()) validationErrors.designation = 'La désignation est obligatoire.';
    if (!category) validationErrors.categorie = 'La catégorie est obligatoire.';
    if (
      !editingItem &&
      (stock === '' || Number(stock) <= 0 || !Number.isInteger(Number(stock)))
    ) {
      validationErrors.stockTotal = 'Le stock initial doit être un entier strictement supérieur à zéro.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const formData = new FormData();
      formData.append('designation', designation.trim());
      formData.append('categorie', category);
      if (reference.trim()) formData.append('referenceInterne', reference.trim());
      if (description.trim()) formData.append('description', description.trim());
      if (instructions.trim()) formData.append('consignesUtilisation', instructions.trim());
      if (!editingItem) formData.append('stockTotal', String(stock));
      if (photo) formData.append('photo', photo);

      const saved = editingItem
        ? await updateAdminEquipment(editingItem.id, formData)
        : await createAdminEquipment(formData);

      onSaved(saved, editingItem !== null);
    } catch (error) {
      if (error instanceof ApiError && isValidationErrorData(error.data)) {
        setErrors(error.data.errors);
      } else {
        onError(error instanceof Error ? error.message : 'Erreur lors de l’enregistrement.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="equipment-form-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
          <h2 id="equipment-form-title" className="text-lg font-bold text-[var(--ink)]">
            {editingItem ? 'Modifier l’équipement' : 'Ajouter un nouvel équipement'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le formulaire"
            className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--paper)]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="equipment-designation" className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Désignation <span className="text-[var(--Flush-Mahogany)]">*</span>
            </label>
            <input
              id="equipment-designation"
              type="text"
              required
              value={designation}
              onChange={(event) => setDesignation(event.target.value)}
              placeholder="Ex: Barnum pliant 3x3m renforcé"
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2 text-sm text-[var(--ink)] focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none"
            />
            {errors.designation && <p className="mt-1 text-xs text-[var(--Flush-Mahogany)]">{errors.designation}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="equipment-category" className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Catégorie <span className="text-[var(--Flush-Mahogany)]">*</span>
              </label>
              <select
                id="equipment-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none"
              >
                <option value="mobilier">Mobilier</option>
                <option value="sonorisation">Sonorisation</option>
                <option value="barnums">Barnums</option>
                <option value="eclairage">Éclairage</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div>
              <label htmlFor="equipment-reference" className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Référence interne
              </label>
              <input
                id="equipment-reference"
                type="text"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Ex: MAT-BARN-001"
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2 text-sm text-[var(--ink)] focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {!editingItem && (
            <div>
              <label htmlFor="equipment-stock" className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Stock initial communal <span className="text-[var(--Flush-Mahogany)]">* (&gt; 0)</span>
              </label>
              <input
                id="equipment-stock"
                type="number"
                min="1"
                step="1"
                required
                value={stock}
                onChange={(event) => setStock(event.target.value === '' ? '' : Number(event.target.value))}
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2 text-sm text-[var(--ink)] focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none"
              />
              {errors.stockTotal && <p className="mt-1 text-xs text-[var(--Flush-Mahogany)]">{errors.stockTotal}</p>}
            </div>
          )}

          <div>
            <label htmlFor="equipment-description" className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Description
            </label>
            <textarea
              id="equipment-description"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Caractéristiques techniques, dimensions, coloris..."
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2 text-sm text-[var(--ink)] focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="equipment-instructions" className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Consignes d&apos;utilisation et de transport
            </label>
            <textarea
              id="equipment-instructions"
              rows={2}
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Précautions d'arrimage, lestage impératif, manipulation..."
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2 text-sm text-[var(--ink)] focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="equipment-photo" className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Photo indicative (JPEG, PNG, WebP)
            </label>
            <input
              id="equipment-photo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
              className="mt-1.5 w-full text-xs text-[var(--muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--Pale-Sage)] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[var(--Mosaic-Tile)] hover:file:bg-[var(--sage)]"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--line)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:bg-[var(--paper)]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[var(--Mosaic-Tile)] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-[var(--moss)] disabled:opacity-50"
            >
              {submitting
                ? 'Enregistrement...'
                : editingItem
                  ? 'Enregistrer les modifications'
                  : 'Enregistrer au catalogue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function isValidationErrorData(
  data: unknown,
): data is { errors: Record<string, string> } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'errors' in data &&
    typeof data.errors === 'object' &&
    data.errors !== null
  );
}
