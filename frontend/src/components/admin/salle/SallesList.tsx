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
  const address = value.trim().replace(/\s+/g, ' ');
  return /^(?:[\p{L}\d][\p{L}\d .'-]*,\s*\d{5}\s+[\p{L}][\p{L} .'-]*|[\p{L}\d][\p{L}\d .'-]*,\s*[\p{L}][\p{L} .'-]*\s+\d{5})$/u.test(address);
}

const EQUIPMENT_META: Record<string, { label: string; icon: (props: { className?: string }) => React.JSX.Element }> = {
  VIDEOPROJECTEUR: {
    label: 'Vidéoprojecteur',
    icon: ({ className = 'h-3.5 w-3.5' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="2" y="7" width="14" height="10" rx="2" />
        <path d="M16 10l5-3v10l-5-3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  CUISINE: {
    label: 'Cuisine',
    icon: ({ className = 'h-3.5 w-3.5' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" strokeLinecap="round" />
        <line x1="10" y1="1" x2="10" y2="4" strokeLinecap="round" />
        <line x1="14" y1="1" x2="14" y2="4" strokeLinecap="round" />
      </svg>
    ),
  },
  VESTIAIRES: {
    label: 'Vestiaires',
    icon: ({ className = 'h-3.5 w-3.5' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="19" y1="11" x2="19" y2="17" strokeLinecap="round" />
        <line x1="22" y1="14" x2="16" y2="14" strokeLinecap="round" />
      </svg>
    ),
  },
  SCENE: {
    label: 'Scène',
    icon: ({ className = 'h-3.5 w-3.5' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
};

function getEquipmentInfo(raw: string) {
  const normalized = raw
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (EQUIPMENT_META[normalized]) {
    return EQUIPMENT_META[normalized];
  }

  return {
    label: raw,
    icon: ({ className = 'h-3.5 w-3.5' }: { className?: string }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  };
}

function ActionIcon({ name }: { name: 'edit' | 'archive' | 'status' }) {
  const paths = {
    edit: <><path d="m13.5 5.5 1 1M4 16l.5-3.5L12.8 4.2a1.7 1.7 0 0 1 2.4 2.4L6.9 15z" /><path d="M4 16h3" /></>,
    archive: <><path d="M4 7h12v9H4zM3 4h14v3H3zM7 10h6" /></>,
    status: <><path d="M4 10a6 6 0 1 0 2-4.5" /><path d="M4 4v4h4" /></>,
  };
  return <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function AccessibilityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="15" cy="4.5" r="2" />
      <path d="M9 8h6l1.5 5.5H13l-1 3.5a4 4 0 1 1-3.5-2" />
      <path d="M9 8 7 13l-3 2M13 13l4 2 2 4M7.5 20a5.5 5.5 0 1 0 0-11" />
    </svg>
  );
}

export default function SallesList() {
  const [salles, setSalles] = useState<Salle[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Salle | null>(null);
  const [editingImage, setEditingImage] = useState<File | null>(null);
  const [brokenImageIds, setBrokenImageIds] = useState<number[]>([]);
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
    setEditingImage(null);
    setMessage('');
    setError('');
  }

  async function save() {
    if (!form || !form.nom.trim() || !form.adresse.trim() || form.capaciteMax <= 0) {
      setError('Le nom, l\'adresse et une capacité supérieure à zéro sont obligatoires.');
      return;
    }

    if (!isFrenchAddress(form.adresse)) {
      setError('Saisissez une adresse avec une voie, un code postal à 5 chiffres et une ville.');
      return;
    }

    if (editingImage && (!['image/jpeg', 'image/png', 'image/webp'].includes(editingImage.type) || editingImage.size > 5 * 1024 * 1024)) {
      setError('La nouvelle image doit être au format JPEG, PNG ou WebP et ne pas dépasser 5 Mo.');
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
        image: editingImage ?? undefined,
      });

      setSalles((current) => current.map((salle) => salle.id === updated.id ? updated : salle));
      setBrokenImageIds((current) => current.filter((id) => id !== updated.id));
      setEditingId(null);
      setForm(null);
      setEditingImage(null);
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
    if (!window.confirm(`Archiver la salle "${salle.nom}" ?`)) {
      return;
    }
    setError('');
    setMessage('');
    try {
      const updated = await archiveSalle(salle.id);
      setSalles((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage('La salle a été archivée et bloquée pour les réservations.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible d\'archiver la salle.');
    }
  }

  return (
    <AdminPanel className="mb-8 overflow-hidden">
      <div className="border-b border-line px-6 py-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-caption font-black uppercase tracking-section text-primary">Catalogue</p>
            <h2 className="mt-1 text-xl font-black tracking-display text-ink">Gestion des salles</h2>
          </div>
          <span className="rounded-pill bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary">{filteredSalles.length} résultat{filteredSalles.length > 1 ? 's' : ''}</span>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Rechercher une salle</span>
            <input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Rechercher par nom ou adresse..."
              className="w-full rounded-control border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <div className="relative w-full md:w-52">
            <label htmlFor="salle-status-filter" className="sr-only">
              Filtrer par statut
            </label>
            <select
              id="salle-status-filter"
              value={statusFilter}
              onChange={(event) => { setStatusFilter(event.target.value as typeof statusFilter); setPage(1); }}
              className="w-full appearance-none rounded-control border border-line bg-white pl-3.5 pr-10 py-2.5 text-sm font-semibold text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIVE">Actives</option>
              <option value="INACTIVE">Indisponibles</option>
              <option value="ARCHIVED">Archivées</option>
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted" aria-hidden="true">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {error && <p className="mb-4 rounded-control border border-danger/30 bg-rose-50/70 p-3 text-sm font-semibold text-danger" role="alert">{error}</p>}
        {message && <p className="mb-4 rounded-control border border-primary/30 bg-primary-soft/40 p-3 text-sm font-semibold text-primary" role="status">{message}</p>}

        {salles.length === 0 ? (
          <p className="rounded-control border border-dashed border-line bg-paper px-5 py-12 text-center text-sm text-muted">Aucune salle enregistrée.</p>
        ) : visibleSalles.length === 0 ? (
          <p className="rounded-control border border-dashed border-line bg-paper px-5 py-12 text-center text-sm text-muted">Aucune salle ne correspond à ces filtres.</p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {visibleSalles.map((salle) => (
              <div key={salle.id} className="overflow-hidden rounded-card border border-line bg-white transition hover:border-primary hover:shadow-xs">
                {editingId === salle.id && form ? (
                  <div className="grid gap-4 bg-paper p-5 md:grid-cols-2">
                    <label className="text-sm font-bold text-ink md:col-span-2">
                      Nouvelle image
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => setEditingImage(event.target.files?.[0] ?? null)}
                        className="mt-2 w-full rounded-control border border-dashed border-line bg-white px-3 py-2.5 text-sm font-normal text-ink"
                      />
                      <span className="mt-1 block text-xs font-normal text-muted">Facultatif : JPEG, PNG ou WebP, 5 Mo maximum.</span>
                    </label>

                    <input value={form.nom} onChange={(event) => setForm({ ...form, nom: event.target.value })} className="rounded-control border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary" aria-label="Nom de la salle" />
                    <textarea value={form.adresse} onChange={(event) => setForm({ ...form, adresse: event.target.value })} rows={2} className="rounded-control border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary" aria-label="Adresse de la salle" />
                    <textarea value={form.description ?? ''} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="rounded-control border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary md:col-span-2" aria-label="Description de la salle" />
                    <input type="number" min="1" value={form.capaciteMax} onChange={(event) => setForm({ ...form, capaciteMax: Number(event.target.value) })} className="rounded-control border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary" aria-label="Capacité maximale" />

                    <label className="flex items-center gap-2 text-sm font-bold text-ink cursor-pointer">
                      <input type="checkbox" checked={form.accesPmr} onChange={(event) => setForm({ ...form, accesPmr: event.target.checked })} className="accent-primary" />
                      Accès PMR
                    </label>

                    <fieldset className="md:col-span-2">
                      <legend className="text-sm font-bold text-ink">Équipements inclus</legend>
                      <div className="mt-2 flex flex-wrap gap-4">
                        {EQUIPMENT_OPTIONS.map((equipment) => (
                          <label key={equipment.value} className="flex items-center gap-2 text-sm text-muted cursor-pointer">
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
                      <button type="button" onClick={() => void save()} className="rounded-control bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-hover cursor-pointer">Enregistrer</button>
                      <button type="button" onClick={() => { setEditingId(null); setForm(null); setEditingImage(null); }} className="rounded-control border border-line px-4 py-2 text-sm font-bold text-ink transition hover:bg-paper cursor-pointer">Annuler</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col justify-between">
                    <div>
                      {salle.imageUrl && !brokenImageIds.includes(salle.id) ? (
                        <Image
                          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost'}${salle.imageUrl}`}
                          alt={`Photo de ${salle.nom}`}
                          width={640}
                          height={320}
                          unoptimized
                          className="h-52 w-full object-cover"
                          onError={() => setBrokenImageIds((current) => current.includes(salle.id) ? current : [...current, salle.id])}
                        />
                      ) : (
                        <div className="flex h-52 w-full items-center justify-center bg-primary-soft text-primary" role="img" aria-label={`Aucune image pour ${salle.nom}`}>
                          <span className="flex h-20 w-20 items-center justify-center rounded-pill border-2 border-primary" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 20V9l8-5 8 5v11M8 20v-6h8v6M3 20h18" />
                            </svg>
                          </span>
                        </div>
                      )}
                      <div className="min-w-0 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-black text-base text-ink">{salle.nom}</h3>
                            <p className="mt-0.5 text-sm text-muted">{salle.adresse}</p>
                          </div>
                          <span
                            className={`inline-flex shrink-0 rounded-pill px-2.5 py-1 text-caption font-bold ${
                              salle.deletedAt
                                ? 'bg-danger/10 text-danger'
                                : salle.isActive
                                  ? 'bg-accent text-primary'
                                  : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {salle.deletedAt ? 'Archivée' : salle.isActive ? 'Active' : 'Indisponible'}
                          </span>
                        </div>

                        <p className="mt-2 text-xs font-semibold text-muted">
                          Capacité d&apos;accueil : <span className="font-bold text-ink">{salle.capaciteMax} personnes</span>
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          {salle.accesPmr && (
                            <span
                              className="inline-flex items-center gap-1.5 rounded-pill border border-primary/30 bg-primary-soft px-2.5 py-1 text-caption font-bold text-primary"
                              title="Accès PMR disponible"
                            >
                              <AccessibilityIcon />
                              <span>PMR</span>
                            </span>
                          )}
                          {salle.equipementsInclus && salle.equipementsInclus.length > 0 ? (
                            salle.equipementsInclus.map((eq) => {
                              const info = getEquipmentInfo(eq);
                              const Icon = info.icon;
                              return (
                                <span
                                  key={eq}
                                  className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-paper px-2.5 py-1 text-caption font-semibold text-ink"
                                  title={info.label}
                                >
                                  <Icon className="h-3.5 w-3.5 text-primary" />
                                  <span>{info.label}</span>
                                </span>
                              );
                            })
                          ) : (
                            !salle.accesPmr && (
                              <span className="text-xs italic text-muted">
                                Aucun équipement spécifique
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 border-t border-line bg-paper/50 p-4">
                      {!salle.deletedAt && (
                        <>
                          <button type="button" onClick={() => startEditing(salle)} className="inline-flex items-center gap-2 rounded-control border border-line px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary-soft/40 cursor-pointer"><ActionIcon name="edit" />Modifier</button>
                          <button
                            type="button"
                            onClick={() => void toggleStatus(salle)}
                            className={`inline-flex items-center gap-2 rounded-control px-3 py-2 text-xs font-bold transition cursor-pointer ${salle.isActive ? 'border border-amber-300 text-amber-700 hover:bg-amber-50' : 'bg-primary text-white hover:bg-primary-hover'}`}
                          >
                            <ActionIcon name="status" />
                            {salle.isActive ? 'Indisponible' : 'Disponible'}
                          </button>
                          <button type="button" onClick={() => void archive(salle)} className="inline-flex items-center gap-2 rounded-control border border-danger/30 px-3 py-2 text-xs font-bold text-danger transition hover:bg-rose-50 cursor-pointer"><ActionIcon name="archive" />Archiver</button>
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
          <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-xs font-semibold text-muted">
            <span>Page {page} sur {totalPages}</span>
            <div className="flex gap-2">
              <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-control border border-line px-3 py-2 hover:bg-paper disabled:opacity-40 cursor-pointer">Précédente</button>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-control border border-line px-3 py-2 hover:bg-paper disabled:opacity-40 cursor-pointer">Suivante</button>
            </div>
          </div>
        )}
      </div>
    </AdminPanel>
  );
}