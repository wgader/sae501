'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { archiveSalle, getSalles, type Salle, updateSalle, updateSalleStatus } from '@/lib/api';
import AdminPanel from '@/components/admin/AdminPanel';

const EQUIPMENT_OPTIONS = [
  { value: 'CUISINE', label: 'Cuisine' },
  { value: 'VIDEOPROJECTEUR', label: 'Vidéoprojecteur' },
  { value: 'VESTIAIRES', label: 'Vestiaires' },
  { value: 'SCENE', label: 'Scène' },
];

function isFrenchAddress(value: string): boolean {
  return /^[\p{L}][\p{L} .'-]*,\s*\d{5}\s+[\p{L}][\p{L} .'-]*$/u.test(value.trim().replace(/\s+/g, ' '));
}

export default function SallesList() {
  const [salles, setSalles] = useState<Salle[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Salle | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const filteredSalles = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return salles.filter((salle) => {
      const matchesSearch = !normalizedSearch
        || salle.nom.toLowerCase().includes(normalizedSearch)
        || salle.adresse.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === 'ALL'
        || (statusFilter === 'ARCHIVED' && salle.deletedAt !== null)
        || (statusFilter === 'ACTIVE' && salle.deletedAt === null && salle.isActive)
        || (statusFilter === 'INACTIVE' && salle.deletedAt === null && !salle.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [salles, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSalles.length / pageSize));
  const visibleSalles = filteredSalles.slice((page - 1) * pageSize, page * pageSize);

  async function loadSalles() {
    try {
      setSalles(await getSalles());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de charger les salles.');
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSalles();
    }, 0);

    return () => window.clearTimeout(timeoutId);
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
    if (!isFrenchAddress(form.adresse)) {
      setError('Saisissez une adresse avec une voie, un code postal à 5 chiffres et une ville.');
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

  async function toggleStatus(salle: Salle) {
    setError('');
    setMessage('');
    try {
      const updated = await updateSalleStatus(salle.id, !salle.isActive);
      setSalles((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(updated.isActive ? 'La salle est de nouveau disponible.' : 'La salle a été rendu indisponible.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de modifier le statut de la salle.');
    }
  }

  async function archive(salle: Salle) {
    if (!window.confirm(`Archiver la salle « ${salle.nom} » ?`)) {
      return;
    }

    setError('');
    setMessage('');
    try {
      const updated = await archiveSalle(salle.id);
      setSalles((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage('La salle a été archivée et bloquée pour les réservations.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible d’archiver la salle.');
    }
  }

  return (
    <AdminPanel className="mb-8 overflow-hidden">
    <div className="border-b border-[#D9E8E4] px-6 py-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#146E67]">Catalogue</p>
          <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-[#1E2420]">Salles disponibles</h2>
        </div>
        <span className="rounded-full bg-[#E8F4F2] px-3 py-1.5 text-xs font-bold text-[#146E67]">{filteredSalles.length} résultat{filteredSalles.length > 1 ? 's' : ''}</span>
      </div>
      <div className="mt-5 flex flex-col gap-3 md:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Rechercher une salle</span>
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Rechercher par nom ou adresse..."
            className="w-full rounded-lg border border-[#C9D9D4] bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-[#9AA9A3] focus:border-[#146E67] focus:ring-2 focus:ring-[#146E67]/10"
          />
        </label>
        <label>
          <span className="sr-only">Filtrer par statut</span>
          <select
            value={statusFilter}
            onChange={(event) => { setStatusFilter(event.target.value as typeof statusFilter); setPage(1); }}
            className="w-full rounded-lg border border-[#C9D9D4] bg-white px-4 py-2.5 text-sm font-semibold text-[#4D625B] outline-none focus:border-[#146E67] md:w-44"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actives</option>
            <option value="INACTIVE">Indisponibles</option>
            <option value="ARCHIVED">Archivées</option>
          </select>
        </label>
      </div>
    </div>
    <div className="p-6">
    {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
    {message && <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700" role="status">{message}</p>}
    {salles.length === 0 ? (
      <p className="rounded-lg border border-dashed border-[#B9D8D1] bg-[#F7FBF8] px-5 py-12 text-center text-sm text-[#6D746E]">Aucune salle enregistrée.</p>
    ) : visibleSalles.length === 0 ? (
      <p className="rounded-lg border border-dashed border-[#B9D8D1] bg-[#F7FBF8] px-5 py-12 text-center text-sm text-[#6D746E]">Aucune salle ne correspond à ces filtres.</p>
    ) : (
      <div className="grid gap-4 xl:grid-cols-2">
        {visibleSalles.map((salle) => (
          <div key={salle.id} className="overflow-hidden rounded-xl border border-[#D9E8E4] bg-white transition hover:border-[#8EBCB3] hover:shadow-sm">
            {editingId === salle.id && form ? (
              <div className="grid gap-4 bg-[#F7FBF8] p-5 md:grid-cols-2">
                <input value={form.nom} onChange={(event) => setForm({ ...form, nom: event.target.value })} className="rounded-lg border border-[#C9D9D4] px-3 py-2 text-sm outline-none focus:border-[#146E67]" aria-label="Nom de la salle" />
                <textarea value={form.adresse} onChange={(event) => setForm({ ...form, adresse: event.target.value })} rows={2} className="rounded-lg border border-[#C9D9D4] px-3 py-2 text-sm outline-none focus:border-[#146E67]" aria-label="Adresse de la salle" />
                <textarea value={form.description ?? ''} onChange={(event) => setForm({ ...form, description: event.target.value })} className="rounded-lg border border-[#C9D9D4] px-3 py-2 text-sm outline-none focus:border-[#146E67] md:col-span-2" aria-label="Description de la salle" />
                <input type="number" min="1" value={form.capaciteMax} onChange={(event) => setForm({ ...form, capaciteMax: Number(event.target.value) })} className="rounded-lg border border-[#C9D9D4] px-3 py-2 text-sm outline-none focus:border-[#146E67]" aria-label="Capacité maximale" />
                <label className="flex items-center gap-2 text-sm font-bold text-[#4D625B]">
                  <input type="checkbox" checked={form.accesPmr} onChange={(event) => setForm({ ...form, accesPmr: event.target.checked })} className="accent-[#146E67]" />
                    Accès PMR
                  </label>
                  <fieldset className="md:col-span-2">
                    <legend className="text-sm font-bold text-[#4D625B]">Équipements inclus</legend>
                    <div className="mt-2 flex flex-wrap gap-4">
                      {EQUIPMENT_OPTIONS.map((equipment) => (
                        <label key={equipment.value} className="flex items-center gap-2 text-sm text-[#6D746E]">
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
                    <button type="button" onClick={() => void save()} className="rounded-lg bg-[#146E67] px-4 py-2 text-sm font-bold text-white">Enregistrer</button>
                    <button type="button" onClick={() => { setEditingId(null); setForm(null); }} className="rounded-lg border border-[#B9D8D1] px-4 py-2 text-sm font-bold text-[#4D625B]">Annuler</button>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col justify-between">
                  <div className="flex gap-4 p-4">
                    {salle.imageUrl && (
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost'}${salle.imageUrl}`}
                        alt={`Photo de ${salle.nom}`}
                        width={128}
                        height={96}
                        unoptimized
                        className="h-24 w-32 shrink-0 rounded-lg object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <h3 className="font-black text-[#1E2420]">{salle.nom}</h3>
                      <p className="mt-1 text-sm text-[#6D746E]">{salle.adresse}</p>
                      <p className="mt-2 text-xs text-[#6D746E]">{salle.capaciteMax} places · {salle.equipementsInclus.join(', ') || 'Aucun équipement'}</p>
                      <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${salle.deletedAt ? 'bg-[#FFE3E7] text-[#CD2429]' : salle.isActive ? 'bg-[#D8EC95] text-[#146E67]' : 'bg-[#FFF1D6] text-[#986A1B]'}`}>
                        {salle.deletedAt ? 'Archivée' : salle.isActive ? 'Active' : 'Indisponible'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-[#E8EFEB] bg-[#FCFDFC] p-4">
                    {!salle.deletedAt && (
                      <>
                        <button type="button" onClick={() => startEditing(salle)} className="rounded-lg border border-[#B9D8D1] px-3 py-2 text-xs font-bold text-[#146E67] hover:bg-[#E8F4F2]">Modifier</button>
                        <button
                          type="button"
                          onClick={() => void toggleStatus(salle)}
                          className={`rounded-lg px-3 py-2 text-xs font-bold ${salle.isActive ? 'border border-amber-300 text-amber-700 hover:bg-amber-50' : 'bg-[#146E67] text-white hover:bg-[#0F5A54]'}`}
                        >
                          {salle.isActive ? 'Indisponible' : 'Disponible'}
                        </button>
                        <button type="button" onClick={() => void archive(salle)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50">Archiver</button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {filteredSalles.length > 0 && (
        <div className="mt-6 flex items-center justify-between border-t border-[#E8EFEB] pt-4 text-xs font-semibold text-[#6D746E]">
          <span>Page {page} sur {totalPages}</span>
          <div className="flex gap-2">
            <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-md border border-[#B9D8D1] px-3 py-2 hover:bg-[#E8F4F2] disabled:opacity-40">Précédente</button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-md border border-[#B9D8D1] px-3 py-2 hover:bg-[#E8F4F2] disabled:opacity-40">Suivante</button>
          </div>
        </div>
      )}
      </div>
    </AdminPanel>
  );
}
