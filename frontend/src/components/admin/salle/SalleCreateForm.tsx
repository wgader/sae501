'use client';

import { type FormEvent, useState } from 'react';
import { createSalle } from '@/lib/api';
import AdminPanel from '@/components/admin/AdminPanel';

const EQUIPMENT_OPTIONS = [
  { value: 'CUISINE', label: 'Cuisine' },
  { value: 'VIDEOPROJECTEUR', label: 'Vidéoprojecteur' },
  { value: 'VESTIAIRES', label: 'Vestiaires' },
  { value: 'SCENE', label: 'Scène' },
];

function isFrenchAddress(value: string): boolean {
  const address = value.trim().replace(/\s+/g, ' ');
  return /^(?:[\p{L}\d][\p{L}\d .'-]*,\s*\d{5}\s+[\p{L}][\p{L} .'-]*|[\p{L}\d][\p{L}\d .'-]*,\s*[\p{L}][\p{L} .'-]*\s+\d{5})$/u.test(address);
}

type SalleCreateFormProps = {
  onCreated?: () => void;
};

export default function SalleCreateForm({ onCreated }: SalleCreateFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [nom, setNom] = useState('');
  const [adresse, setAdresse] = useState('');
  const [description, setDescription] = useState('');
  const [capaciteMax, setCapaciteMax] = useState('');
  const [accesPmr, setAccesPmr] = useState(false);
  const [equipementsInclus, setEquipementsInclus] = useState<string[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleEquipment(value: string) {
    setEquipementsInclus((current) => (
      current.includes(value)
        ? current.filter((equipment) => equipment !== value)
        : [...current, value]
    ));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const capacity = Number(capaciteMax);
    if (!nom.trim() || !adresse.trim() || !Number.isInteger(capacity) || capacity <= 0) {
      setError('Renseignez les champs obligatoires.');
      return;
    }
    if (!isFrenchAddress(adresse)) {
      setError('Saisissez une adresse avec une voie, un code postal à 5 chiffres et une ville.');
      return;
    }
    if (image && (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type) || image.size > 5 * 1024 * 1024)) {
      setError('L’image doit être au format JPEG, PNG ou WebP et ne pas dépasser 5 Mo.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createSalle({
        nom: nom.trim(),
        adresse: adresse.trim(),
        description: description.trim() || undefined,
        capaciteMax: capacity,
        accesPmr,
        equipementsInclus,
        image: image ?? undefined,
      });
      onCreated?.();
      setNom('');
      setAdresse('');
      setDescription('');
      setCapaciteMax('');
      setAccesPmr(false);
      setEquipementsInclus([]);
      setImage(null);
      const imageInput = document.getElementById('salle-image') as HTMLInputElement | null;
      if (imageInput) imageInput.value = '';
      setSuccess('La salle a été créée avec succès.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de créer la salle.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminPanel className="mb-8 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="salle-create-form"
        className="flex w-full items-center justify-between gap-4 bg-paper px-6 py-5 text-left transition hover:bg-primary-soft/40 cursor-pointer"
      >
        <span>
          <span className="block text-caption font-black uppercase tracking-section text-primary">Nouveau lieu</span>
          <span className="mt-1 block text-xl font-black tracking-display text-ink">Ajouter une salle</span>
          <span className="mt-1 block text-sm font-normal text-muted">La salle sera active immédiatement après sa création.</span>
        </span>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border border-line text-primary transition ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
            <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div id="salle-create-form" hidden={!isOpen} className="p-6">
        {error && <p className="mb-5 rounded-control border border-danger/30 bg-rose-50/70 p-3 text-sm font-semibold text-danger" role="alert">{error}</p>}
        {success && <p className="mb-5 rounded-control border border-primary/30 bg-primary-soft/40 p-3 text-sm font-semibold text-primary" role="status">{success}</p>}

        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-bold text-ink">
            Nom de la salle *
            <input value={nom} onChange={(event) => setNom(event.target.value)} className="mt-2 w-full rounded-control border border-line bg-white px-3 py-2.5 text-sm font-normal text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>
          <label className="text-sm font-bold text-ink">
            Adresse *
            <textarea value={adresse} onChange={(event) => setAdresse(event.target.value)} rows={2} className="mt-2 w-full rounded-control border border-line bg-white px-3 py-2.5 text-sm font-normal text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="185 rue Louis Destouches, Limoges 87000" />
          </label>
          <label className="text-sm font-bold text-ink md:col-span-2">
            Description
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="mt-2 w-full rounded-control border border-line bg-white px-3 py-2.5 text-sm font-normal text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>
          <label className="text-sm font-bold text-ink">
            Capacité maximale *
            <input type="number" min="1" step="1" value={capaciteMax} onChange={(event) => setCapaciteMax(event.target.value)} className="mt-2 w-full rounded-control border border-line bg-white px-3 py-2.5 text-sm font-normal text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>
          <label className="text-sm font-bold text-ink">
            Image de la salle
            <input
              id="salle-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
              className="mt-2 w-full rounded-control border border-dashed border-line bg-paper px-3 py-2.5 text-sm font-normal text-ink"
            />
            <span className="mt-1 block text-xs font-normal text-muted">Facultative · JPEG, PNG ou WebP, 5 Mo maximum. Un visuel par défaut sera utilisé si elle est absente.</span>
          </label>
          <label className="flex items-center gap-3 self-end pb-2 text-sm font-bold text-ink">
            <input type="checkbox" checked={accesPmr} onChange={(event) => setAccesPmr(event.target.checked)} className="h-4 w-4 accent-primary" />
            Accès PMR
          </label>
          <fieldset className="md:col-span-2">
            <legend className="text-sm font-bold text-ink">Équipements inclus</legend>
            <div className="mt-3 flex flex-wrap gap-4">
              {EQUIPMENT_OPTIONS.map((equipment) => (
                <label key={equipment.value} className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={equipementsInclus.includes(equipment.value)}
                    onChange={() => toggleEquipment(equipment.value)}
                    className="h-4 w-4 accent-primary"
                  />
                  {equipment.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="md:col-span-2">
            <button type="submit" disabled={isSubmitting} className="rounded-control bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-primary-hover disabled:opacity-50 cursor-pointer">
              {isSubmitting ? 'Création en cours…' : 'Créer la salle'}
            </button>
          </div>
        </form>
      </div>
    </AdminPanel>
  );
}
