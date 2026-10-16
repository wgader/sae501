'use client';

import { useEffect, useState } from 'react';
import { getSalles, type Salle, updateSalle } from '@/lib/api';

const EQUIPMENT_OPTIONS = [
  { value: 'CUISINE', label: 'Cuisine' },
  { value: 'VIDEOPROJECTEUR', label: 'Vidéoprojecteur' },
  { value: 'VESTIAIRES', label: 'Vestiaires' },
  { value: 'SCENE', label: 'Scène' },
];

export default function SallesList() {
  const [salles, setSalles] = useState<Salle[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Salle | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadSalles() {
    try {
      setSalles(await getSalles());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de charger les salles.');
    }
  }

  useEffect(() => {
    void loadSalles();
  }, []);

  function startEditing(salle: Salle) {
    setEditingId(salle.id);
    setForm({ ...salle, equipementsInclus: [...salle.equipementsInclus] });
    setMessage('');
    setError('');
  }

  async function save() {
    if (!form || !form.nom.trim() || !form.adresse.trim() || form.capaciteMax <= 0) {
      setError('Le nom, l’adresse et une capacité supérieure à zéro sont obligatoires.');
      return;
    }

    try {
      const updated = await updateSalle(form.id, {
        nom: form.nom.trim(),
        adresse: form.adresse.trim(),
        description: form.description || undefined,
        capaciteMax: form.capaciteMax,
        accesPmr: form.accesPmr,
        equipementsInclus: form.equipementsInclus,
      });
      setSalles((current) => current.map((salle) => salle.id === updated.id ? updated : salle));
      setEditingId(null);
      setForm(null);
      setMessage('La salle a été modifiée.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de modifier la salle.');
    }
  }

  return (
    <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-semibold text-slate-900">Salles du catalogue</h2>
      {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      {message && <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700" role="status">{message}</p>}
      {salles.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune salle enregistrée.</p>
      ) : (
        <div className="space-y-4">
          {salles.map((salle) => (
            <div key={salle.id} className="rounded-lg border border-slate-200 p-4">
              {editingId === salle.id && form ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <input value={form.nom} onChange={(event) => setForm({ ...form, nom: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2" aria-label="Nom de la salle" />
                  <input value={form.adresse} onChange={(event) => setForm({ ...form, adresse: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2" aria-label="Adresse de la salle" />
                  <textarea value={form.description ?? ''} onChange={(event) => setForm({ ...form, description: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" aria-label="Description de la salle" />
                  <input type="number" min="1" value={form.capaciteMax} onChange={(event) => setForm({ ...form, capaciteMax: Number(event.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2" aria-label="Capacité maximale" />
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={form.accesPmr} onChange={(event) => setForm({ ...form, accesPmr: event.target.checked })} />
                    Accès PMR
                  </label>
                  <fieldset className="md:col-span-2">
                    <legend className="text-sm font-medium text-slate-700">Équipements inclus</legend>
                    <div className="mt-2 flex flex-wrap gap-4">
                      {EQUIPMENT_OPTIONS.map((equipment) => (
                        <label key={equipment.value} className="flex items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={form.equipementsInclus.includes(equipment.value)}
                            onChange={() => setForm({
                              ...form,
                              equipementsInclus: form.equipementsInclus.includes(equipment.value)
                                ? form.equipementsInclus.filter((value) => value !== equipment.value)
                                : [...form.equipementsInclus, equipment.value],
                            })}
                          />
                          {equipment.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="flex gap-2 md:col-span-2">
                    <button type="button" onClick={() => void save()} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Enregistrer</button>
                    <button type="button" onClick={() => { setEditingId(null); setForm(null); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Annuler</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{salle.nom}</h3>
                    <p className="text-sm text-slate-600">{salle.adresse} · {salle.capaciteMax} places</p>
                    <p className="text-xs text-slate-500">{salle.equipementsInclus.join(', ') || 'Aucun équipement indiqué'}</p>
                  </div>
                  <button type="button" onClick={() => startEditing(salle)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Modifier</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
