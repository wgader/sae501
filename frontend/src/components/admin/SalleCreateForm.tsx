'use client';

import { type FormEvent, useState } from 'react';
import { createSalle } from '@/lib/api';

const EQUIPMENT_OPTIONS = [
  { value: 'CUISINE', label: 'Cuisine' },
  { value: 'VIDEOPROJECTEUR', label: 'Vidéoprojecteur' },
  { value: 'VESTIAIRES', label: 'Vestiaires' },
  { value: 'SCENE', label: 'Scène' },
];

export default function SalleCreateForm() {
  const [nom, setNom] = useState('');
  const [adresse, setAdresse] = useState('');
  const [description, setDescription] = useState('');
  const [capaciteMax, setCapaciteMax] = useState('');
  const [accesPmr, setAccesPmr] = useState(false);
  const [equipementsInclus, setEquipementsInclus] = useState<string[]>([]);
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
      setError('Renseignez le nom, l’adresse et une capacité entière supérieure à zéro.');
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
      });
      setNom('');
      setAdresse('');
      setDescription('');
      setCapaciteMax('');
      setAccesPmr(false);
      setEquipementsInclus([]);
      setSuccess('La salle a été créée avec succès.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de créer la salle.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Ajouter une salle</h2>
        <p className="mt-1 text-sm text-slate-500">La salle sera active immédiatement après sa création.</p>
      </div>

      {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      {success && <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700" role="status">{success}</p>}

      <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Nom de la salle *
          <input value={nom} onChange={(event) => setNom(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Adresse *
          <input value={adresse} onChange={(event) => setAdresse(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2">
          Description
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Capacité maximale *
          <input type="number" min="1" step="1" value={capaciteMax} onChange={(event) => setCapaciteMax(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex items-center gap-3 self-end pb-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={accesPmr} onChange={(event) => setAccesPmr(event.target.checked)} className="h-4 w-4" />
          Accès PMR
        </label>
        <fieldset className="md:col-span-2">
          <legend className="text-sm font-medium text-slate-700">Équipements inclus</legend>
          <div className="mt-3 flex flex-wrap gap-4">
            {EQUIPMENT_OPTIONS.map((equipment) => (
              <label key={equipment.value} className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={equipementsInclus.includes(equipment.value)}
                  onChange={() => toggleEquipment(equipment.value)}
                  className="h-4 w-4"
                />
                {equipment.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="md:col-span-2">
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
            {isSubmitting ? 'Création en cours…' : 'Créer la salle'}
          </button>
        </div>
      </form>
    </section>
  );
}
