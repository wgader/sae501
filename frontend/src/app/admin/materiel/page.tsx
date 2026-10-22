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
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--Mosaic-Tile)] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--moss)] focus:outline-none focus:ring-2 focus:ring-[var(--Mosaic-Tile)] focus:ring-offset-2"
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
                : 'border-red-200 bg-red-50 text-[var(--Flush-Mahogany)]'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Filtres & Recherche */}
        <section aria-labelledby="filters-heading" className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 id="filters-heading" className="sr-only">Filtres de recherche</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="search-input" className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Rechercher
              </label>
              <input
                id="search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Désignation, référence interne..."
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2 text-sm text-[var(--ink)] placeholder-[var(--muted)] focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="category-select" className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Catégorie
              </label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2 text-sm text-[var(--ink)] focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status-select" className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Statut catalogue
              </label>
              <select
                id="status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'available' | 'archived')}
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2 text-sm text-[var(--ink)] focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none"
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
            <div className="flex h-40 items-center justify-center rounded-2xl border border-[var(--line)] bg-white">
              <p className="text-sm font-semibold text-[var(--muted)]">Chargement de l&apos;inventaire matériel...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-[var(--Flush-Mahogany)]">
              {error}
            </div>
          ) : filteredList.length === 0 ? (
            <div className="rounded-2xl border border-[var(--line)] bg-white p-12 text-center">
              <p className="text-base font-bold text-[var(--ink)]">Aucun équipement trouvé</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Modifiez vos filtres ou enregistrez un nouveau matériel dans le catalogue.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredList.map((item) => (
                <article
                  key={item.id}
                  className={`flex flex-col justify-between rounded-2xl border bg-white p-5 transition hover:shadow-md ${
                    item.isArchived
                      ? 'border-gray-200 opacity-75'
                      : 'border-[var(--line)] hover:border-[var(--Mosaic-Tile)]/40'
                  }`}
                >
                  <div>
                    {/* Header carte */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-block rounded-full bg-[var(--Pale-Sage)] px-2.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--Mosaic-Tile)]">
                          {item.categorie}
                        </span>
                        {item.referenceInterne && (
                          <span className="ml-2 text-xs font-mono font-medium text-[var(--muted)]">
                            {item.referenceInterne}
                          </span>
                        )}
                      </div>

                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          item.isArchived
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.statut}
                      </span>
                    </div>

                    {/* Image / Thumbnail */}
                    <div className="mt-4 flex h-36 w-full items-center justify-center overflow-hidden rounded-xl bg-[var(--paper)]">
                      {item.imagePath ? (
                        <Image
                          src={item.imagePath}
                          alt={item.designation}
                          width={300}
                          height={150}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-[var(--muted)]">
                          <svg className="h-10 w-10 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span className="mt-1 text-[11px]">Photo non renseignée</span>
                        </div>
                      )}
                    </div>

                    {/* Titre & Description */}
                    <h3 className="mt-4 text-base font-bold text-[var(--ink)]">
                      {item.designation}
                    </h3>
                    {item.description && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">
                        {item.description}
                      </p>
                    )}

                    {/* Consignes transport / utilisation */}
                    {item.consignesUtilisation && (
                      <div className="mt-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-2.5 text-[11px] leading-tight text-[var(--muted)]">
                        <strong className="block font-semibold text-[var(--ink)]">Consignes :</strong>
                        <span className="line-clamp-2">{item.consignesUtilisation}</span>
                      </div>
                    )}
                  </div>

                  {/* Stock & Actions */}
                  <footer className="mt-5 border-t border-[var(--line)] pt-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                        Stock communal
                      </span>
                      <p className="text-xl font-black text-[var(--ink)]">
                        {item.stockTotal}{' '}
                        <span className="text-xs font-normal text-[var(--muted)]">unités</span>
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenAdjust(item)}
                          title="Ajuster le stock"
                          className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 text-xs font-bold text-[var(--ink)] transition hover:border-[var(--Mosaic-Tile)] hover:bg-white"
                        >
                          Ajuster
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          title="Modifier l'équipement"
                          className="rounded-lg border border-[var(--line)] bg-white px-2 py-1.5 text-xs font-bold text-[var(--Mosaic-Tile)] transition hover:border-[var(--Mosaic-Tile)] hover:bg-[var(--Pale-Sage)]"
                        >
                          Modifier
                        </button>

                        {!item.isArchived && (
                          <button
                            type="button"
                            onClick={() => setArchivingItem(item)}
                            title="Archiver l'équipement"
                            className="rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-bold text-[var(--Flush-Mahogany)] transition hover:bg-red-100"
                          >
                            Archiver
                          </button>
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
              <h3 className="text-lg font-bold text-[var(--ink)]">
                Archiver l&apos;équipement ?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                Vous êtes sur le point d&apos;archiver <strong>« {archivingItem.designation} »</strong>.
              </p>
              <div className="mt-3 rounded-xl bg-[var(--paper)] p-3 text-xs leading-relaxed text-[var(--muted)]">
                L&apos;équipement ne sera plus sélectionnable dans le catalogue de prêt usager, mais sera{' '}
                <strong>conservé dans les anciens bons de réservation et dossiers passés</strong> pour garantir la traçabilité complète.
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setArchivingItem(null)}
                  className="rounded-xl border border-[var(--line)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:bg-[var(--paper)]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleArchiveConfirm}
                  className="rounded-xl bg-[var(--Flush-Mahogany)] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-red-700"
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
