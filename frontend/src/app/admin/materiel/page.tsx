'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import EquipmentFormModal from '@/components/admin/EquipmentFormModal';
import EquipmentStockModal from '@/components/admin/EquipmentStockModal';
import {
  Equipment,
  getAdminEquipment,
  deleteAdminEquipment,
  getMediaUrl,
} from '@/lib/api';

const CATEGORIES = [
  { value: '', label: 'Toutes les catégories' },
  { value: 'mobilier', label: 'Mobilier (tables, chaises...)' },
  { value: 'sonorisation', label: 'Sonorisation & Audio' },
  { value: 'barnums', label: 'Barnums & Tentes' },
  { value: 'eclairage', label: 'Éclairage' },
  { value: 'autre', label: 'Autre matériel' },
];

export default function AdminMaterielPage() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [brokenImageIds, setBrokenImageIds] = useState<number[]>([]);

  // Filtres
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'archived'>('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<Equipment | null>(null);
  const [archivingItem, setArchivingItem] = useState<Equipment | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminEquipment();
      setEquipmentList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement du matériel.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  // Filtrage
  const filteredList = useMemo(() => {
    return equipmentList.filter((item) => {
      if (selectedCategory && item.categorie !== selectedCategory) return false;
      if (statusFilter === 'available' && item.isArchived) return false;
      if (statusFilter === 'archived' && !item.isArchived) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const designationMatch = item.designation.toLowerCase().includes(q);
        const refMatch = item.referenceInterne?.toLowerCase().includes(q) ?? false;
        if (!designationMatch && !refMatch) return false;
      }
      return true;
    });
  }, [equipmentList, selectedCategory, statusFilter, search]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // ── Scénario 1 & 5 : Création ──────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (item: Equipment) => {
    setEditingItem(item);
    setIsCreateOpen(true);
  };

  const handleFormSaved = (saved: Equipment, wasEditing: boolean) => {
    setEquipmentList((prev) =>
      wasEditing
        ? prev.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...prev],
    );
    setIsCreateOpen(false);
    setEditingItem(null);
    showToast(
      'success',
      wasEditing
        ? `L'équipement « ${saved.designation} » a été modifié.`
        : `L'équipement « ${saved.designation} » a été ajouté avec le statut Disponible.`,
    );
  };

  // ── Scénarios 2 & 3 : Ajustement de stock ──────────────────────────────────
  const handleOpenAdjust = (item: Equipment) => {
    setAdjustingItem(item);
  };

  const handleStockSaved = (updated: Equipment) => {
    setEquipmentList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setAdjustingItem(null);
    showToast('success', `Stock mis à jour pour « ${updated.designation} » : ${updated.stockTotal} unités en stock.`);
  };

  // ── Scénario 4 : Archivage logique (Soft Delete) ───────────────────────────
  const handleArchiveConfirm = async () => {
    if (!archivingItem) return;
    try {
      const res = await deleteAdminEquipment(archivingItem.id);
      setEquipmentList((prev) =>
        prev.map((item) => (item.id === archivingItem.id ? res.equipment : item))
      );
      setArchivingItem(null);
      showToast('success', `L'équipement « ${archivingItem.designation} » a été archivé (retiré du catalogue usager).`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : "Erreur lors de l'archivage.");
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <AdminPageHeader
            title="Parc Matériel"
            description="Gestion du stock communal d'équipements municipaux, ajustement des disponibilités et archivage logique."
          />
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un équipement
          </button>
        </header>

        {/* Feedback toast */}
        {feedback && (
          <div
            role="status"
            className={`rounded-xl border p-4 text-sm font-semibold transition ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-danger'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Filtres & Recherche */}
        <section aria-labelledby="filters-heading" className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <h2 id="filters-heading" className="sr-only">Filtres de recherche</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="search-input" className="block text-xs font-bold uppercase tracking-wider text-muted">
                Rechercher
              </label>
              <input
                id="search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Désignation, référence interne..."
                className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3.5 py-2 text-sm text-ink placeholder-muted focus:border-primary focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="category-select" className="block text-xs font-bold uppercase tracking-wider text-muted">
                Catégorie
              </label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3.5 py-2 text-sm text-ink focus:border-primary focus:bg-white focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status-select" className="block text-xs font-bold uppercase tracking-wider text-muted">
                Statut catalogue
              </label>
              <select
                id="status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'available' | 'archived')}
                className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3.5 py-2 text-sm text-ink focus:border-primary focus:bg-white focus:outline-none"
              >
                <option value="all">Tous les équipements</option>
                <option value="available">Disponibles uniquement</option>
                <option value="archived">Archivés uniquement</option>
              </select>
            </div>
          </div>
        </section>

        {/* Liste du matériel */}
        <section aria-labelledby="equipment-list-heading" className="space-y-4">
          <h2 id="equipment-list-heading" className="sr-only">Inventaire du matériel</h2>

          {loading ? (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-line bg-white">
              <p className="text-sm font-semibold text-muted">Chargement de l&apos;inventaire matériel...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-danger">
              {error}
            </div>
          ) : filteredList.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-12 text-center">
              <p className="text-base font-bold text-ink">Aucun équipement trouvé</p>
              <p className="mt-1 text-xs text-muted">
                Modifiez vos filtres ou enregistrez un nouveau matériel dans le catalogue.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredList.map((item) => (
                <article
                  key={item.id}
                  className={`group flex flex-col justify-between overflow-hidden rounded-card border bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
                    item.isArchived
                      ? 'border-gray-200 opacity-80'
                      : 'border-line hover:border-primary/40'
                  }`}
                >
                  <div>
                    {/* Image / Thumbnail avec badges superposés */}
                    <div className="relative flex h-52 sm:h-56 w-full items-center justify-center overflow-hidden bg-primary-soft border-b border-line">
                      {item.imagePath && !brokenImageIds.includes(item.id) ? (
                        <Image
                          src={getMediaUrl(item.imagePath)!}
                          alt={`Photo de ${item.designation}`}
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={() =>
                            setBrokenImageIds((prev) =>
                              prev.includes(item.id) ? prev : [...prev, item.id],
                            )
                          }
                        />
                      ) : (
                        <div
                          className="flex h-full w-full flex-col items-center justify-center bg-primary-soft text-primary"
                          role="img"
                          aria-label={`Illustration pour ${item.designation}`}
                        >
                          <span className="flex h-16 w-16 items-center justify-center rounded-pill border-2 border-primary/20 bg-white/70 shadow-xs transition-transform duration-300 group-hover:scale-110">
                            <svg
                              className="h-8 w-8 text-primary"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                              <line x1="12" y1="22.08" x2="12" y2="12" />
                            </svg>
                          </span>
                          <span className="mt-2 text-xs font-semibold text-primary/80">
                            Photo illustrative
                          </span>
                        </div>
                      )}

                      {/* Badges Catégorie et Statut */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                        <span className="rounded-pill bg-white/95 backdrop-blur-xs px-3 py-1 text-caption font-bold uppercase tracking-wider text-primary border border-line shadow-2xs">
                          {item.categorie}
                        </span>

                        <span
                          className={`rounded-pill px-3 py-1 text-caption font-bold shadow-2xs ${
                            item.isArchived
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.statut}
                        </span>
                      </div>
                    </div>

                    {/* Contenu de la carte */}
                    <div className="p-6">
                      {item.referenceInterne && (
                        <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-muted mb-1.5">
                          <span className="inline-block h-1.5 w-1.5 rounded-pill bg-primary/60" />
                          <span>Réf : {item.referenceInterne}</span>
                        </div>
                      )}

                      <h3 className="text-lg font-bold text-ink leading-snug transition-colors group-hover:text-primary">
                        {item.designation}
                      </h3>

                      {item.description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                          {item.description}
                        </p>
                      )}

                      {item.consignesUtilisation && (
                        <div className="mt-4 rounded-soft border border-line bg-paper p-3 text-xs leading-relaxed text-ink/85">
                          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted text-caption">
                            <svg className="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            Consignes d&apos;utilisation
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs">{item.consignesUtilisation}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stock & Boutons d'action adaptés */}
                  <footer className="border-t border-line bg-paper/50 p-6 pt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-caption font-bold uppercase tracking-wider text-muted">
                        Stock communal
                      </span>
                      <p className="text-2xl font-black text-ink">
                        {item.stockTotal}{' '}
                        <span className="text-xs font-medium text-muted">unités</span>
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenAdjust(item)}
                        title="Ajuster le stock communal"
                        className="h-10 px-2 sm:px-3 rounded-control border border-line bg-white text-xs font-bold uppercase tracking-wider text-ink transition hover:border-primary hover:bg-paper flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <svg className="h-3.5 w-3.5 shrink-0 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                          <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                          <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                          <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
                        </svg>
                        <span className="truncate">Ajuster</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        title="Modifier les informations"
                        className="h-10 px-2 sm:px-3 rounded-control bg-primary text-xs font-bold uppercase tracking-wider text-white transition hover:bg-primary-hover flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      >
                        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        <span className="truncate">Modifier</span>
                      </button>

                      {!item.isArchived ? (
                        <button
                          type="button"
                          onClick={() => setArchivingItem(item)}
                          title="Archiver cet équipement"
                          className="h-10 px-2 sm:px-3 rounded-control border border-red-200 bg-red-50 text-xs font-bold uppercase tracking-wider text-danger transition hover:bg-red-100 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" />
                            <line x1="10" y1="12" x2="14" y2="12" />
                          </svg>
                          <span className="truncate">Archiver</span>
                        </button>
                      ) : (
                        <div className="flex h-10 items-center justify-center rounded-control bg-gray-100 text-xs font-medium text-gray-500">
                          Archivé
                        </div>
                      )}
                    </div>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </section>

        {isCreateOpen && (
          <EquipmentFormModal
            key={editingItem?.id ?? 'new-equipment'}
            isOpen
            editingItem={editingItem}
            onClose={() => {
              setIsCreateOpen(false);
              setEditingItem(null);
            }}
            onSaved={handleFormSaved}
            onError={(message) => showToast('error', message)}
          />
        )}

        {adjustingItem && (
          <EquipmentStockModal
            key={adjustingItem.id}
            equipment={adjustingItem}
            onClose={() => setAdjustingItem(null)}
            onSaved={handleStockSaved}
            onError={(message) => showToast('error', message)}
          />
        )}

        {/* ── Modal Confirmation Archivage (Scénario 4) ────────────────────── */}
        {archivingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-ink">
                Archiver l&apos;équipement ?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Vous êtes sur le point d&apos;archiver <strong>« {archivingItem.designation} »</strong>.
              </p>
              <div className="mt-3 rounded-xl bg-paper p-3 text-xs leading-relaxed text-muted">
                L&apos;équipement ne sera plus sélectionnable dans le catalogue de prêt usager, mais sera{' '}
                <strong>conservé dans les anciens bons de réservation et dossiers passés</strong> pour garantir la traçabilité complète.
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setArchivingItem(null)}
                  className="rounded-xl border border-line px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted hover:bg-paper"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleArchiveConfirm}
                  className="rounded-xl bg-danger px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-red-700"
                >
                  Confirmer l&apos;archivage
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
