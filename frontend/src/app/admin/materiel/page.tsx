'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminMetricCard from '@/components/admin/AdminMetricCard';
import {
  Equipment,
  StockCheckResult,
  getAdminEquipment,
  createAdminEquipment,
  updateAdminEquipment,
  checkEquipmentStock,
  deleteAdminEquipment,
  ApiError,
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
  const [adjustingItem, setAdjustingItem] = useState<Equipment | null>(null);
  const [archivingItem, setArchivingItem] = useState<Equipment | null>(null);

  // Form create state
  const [formDesignation, setFormDesignation] = useState('');
  const [formCategory, setFormCategory] = useState('mobilier');
  const [formReference, setFormReference] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formConsignes, setFormConsignes] = useState('');
  const [formStock, setFormStock] = useState<number | ''>(10);
  const [formPhoto, setFormPhoto] = useState<File | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Stock adjustment state
  const [adjustReason, setAdjustReason] = useState('Entrée de stock');
  const [adjustNewStock, setAdjustNewStock] = useState<number | ''>('');
  const [adjustChecking, setAdjustChecking] = useState(false);
  const [adjustConflict, setAdjustConflict] = useState<StockCheckResult | null>(null);
  const [adjustForceConfirm, setAdjustForceConfirm] = useState(false);
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

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

  // Métriques
  const totalEquipments = equipmentList.length;
  const availableEquipments = equipmentList.filter((e) => !e.isArchived).length;
  const totalPhysicalStock = equipmentList
    .filter((e) => !e.isArchived)
    .reduce((sum, e) => sum + e.stockTotal, 0);

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
    setFormDesignation('');
    setFormCategory('mobilier');
    setFormReference('');
    setFormDescription('');
    setFormConsignes('');
    setFormStock(10);
    setFormPhoto(null);
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const errors: Record<string, string> = {};
    if (!formDesignation.trim()) errors.designation = 'La désignation est obligatoire.';
    if (!formCategory) errors.categorie = 'La catégorie est obligatoire.';
    if (formStock === '' || Number(formStock) <= 0 || !Number.isInteger(Number(formStock))) {
      errors.stockTotal = 'Le stock initial doit être un entier strictement supérieur à zéro.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('designation', formDesignation.trim());
      formData.append('categorie', formCategory);
      if (formReference.trim()) formData.append('referenceInterne', formReference.trim());
      if (formDescription.trim()) formData.append('description', formDescription.trim());
      if (formConsignes.trim()) formData.append('consignesUtilisation', formConsignes.trim());
      formData.append('stockTotal', String(formStock));
      if (formPhoto) formData.append('photo', formPhoto);

      const created = await createAdminEquipment(formData);
      setEquipmentList((prev) => [created, ...prev]);
      setIsCreateOpen(false);
      showToast('success', `L'équipement « ${created.designation} » a été ajouté avec le statut Disponible.`);
    } catch (err) {
      if (err instanceof ApiError && err.data && typeof err.data === 'object' && 'errors' in err.data) {
        setFormErrors((err.data as { errors: Record<string, string> }).errors);
      } else {
        showToast('error', err instanceof Error ? err.message : 'Erreur lors de la création.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Scénarios 2 & 3 : Ajustement de stock ──────────────────────────────────
  const handleOpenAdjust = (item: Equipment) => {
    setAdjustingItem(item);
    setAdjustReason('Entrée de stock');
    setAdjustNewStock(item.stockTotal);
    setAdjustConflict(null);
    setAdjustForceConfirm(false);
    setAdjustError(null);
  };

  // Vérification de surbooking en temps réel quand le stock change
  const handleStockInputChange = async (val: string) => {
    const num = val === '' ? '' : Number(val);
    setAdjustNewStock(num);
    setAdjustConflict(null);
    setAdjustForceConfirm(false);
    setAdjustError(null);

    if (num === '' || !Number.isInteger(num) || num < 0) {
      return;
    }

    if (adjustingItem && num < adjustingItem.stockTotal) {
      setAdjustChecking(true);
      try {
        const check = await checkEquipmentStock(adjustingItem.id, num);
        if (check.hasConflict) {
          setAdjustConflict(check);
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de stock:', err);
      } finally {
        setAdjustChecking(false);
      }
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;

    if (adjustNewStock === '' || !Number.isInteger(Number(adjustNewStock)) || Number(adjustNewStock) < 0) {
      setAdjustError('Le stock doit être un entier positif ou nul.');
      return;
    }

    if (adjustConflict?.hasConflict && !adjustForceConfirm) {
      setAdjustError('Veuillez confirmer explicitement la réduction de stock malgré le conflit de réservations.');
      return;
    }

    setAdjustSubmitting(true);
    setAdjustError(null);

    try {
      const updated = await updateAdminEquipment(adjustingItem.id, {
        stockTotal: Number(adjustNewStock),
        force: adjustForceConfirm,
      });

      setEquipmentList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setAdjustingItem(null);
      showToast('success', `Stock mis à jour pour « ${updated.designation} » : ${updated.stockTotal} unités en stock.`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const conflictData = err.data as StockCheckResult;
        setAdjustConflict(conflictData);
        setAdjustError(err.message);
      } else {
        setAdjustError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du stock.');
      }
    } finally {
      setAdjustSubmitting(false);
    }
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

        {/* KPI Metrics */}
        <section aria-labelledby="kpi-heading">
          <h2 id="kpi-heading" className="sr-only">Indicateurs clés du parc</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <AdminMetricCard
              title="Équipements répertoriés"
              value={totalEquipments}
              description="Nombre total de références matérielles créées."
              iconBgClass="bg-[var(--Pale-Sage)] text-[var(--Mosaic-Tile)]"
              actionHref="#equipment-list-heading"
              actionLabel="Voir la liste"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              }
              loading={loading}
            />
            <AdminMetricCard
              title="Disponibles au prêt usager"
              value={availableEquipments}
              description="Matériels actifs visibles par les associations."
              iconBgClass="bg-emerald-100 text-emerald-800"
              actionHref="#equipment-list-heading"
              actionLabel="Consulter"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              loading={loading}
            />
            <AdminMetricCard
              title="Stock physique communal"
              value={totalPhysicalStock}
              description="Unités matérielles cumulées en inventaire."
              iconBgClass="bg-[var(--Lime-Cream)] text-[var(--ink)]"
              actionHref="#equipment-list-heading"
              actionLabel="Gérer les stocks"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              }
              loading={loading}
            />
          </div>
        </section>

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
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                          Stock communal
                        </span>
                        <p className="text-xl font-black text-[var(--ink)]">
                          {item.stockTotal}{' '}
                          <span className="text-xs font-normal text-[var(--muted)]">unités</span>
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenAdjust(item)}
                          title="Ajuster le stock"
                          className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-xs font-bold text-[var(--ink)] transition hover:bg-white hover:border-[var(--Mosaic-Tile)]"
                        >
                          Ajuster
                        </button>

                        {!item.isArchived && (
                          <button
                            type="button"
                            onClick={() => setArchivingItem(item)}
                            title="Archiver l'équipement"
                            className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-[var(--Flush-Mahogany)] transition hover:bg-red-100"
                          >
                            Archiver
                          </button>
                        )}
                      </div>
                    </div>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ── Modal Création d'équipement (Scénarios 1 & 5) ────────────────── */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
                <h3 className="text-lg font-bold text-[var(--ink)]">
                  Ajouter un nouvel équipement
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--paper)]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    Désignation <span className="text-[var(--Flush-Mahogany)]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    placeholder="Ex: Barnum pliant 3x3m renforcé"
                    className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2 text-sm text-[var(--ink)] focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none"
                  />
                  {formErrors.designation && (
                    <p className="mt-1 text-xs text-[var(--Flush-Mahogany)]">{formErrors.designation}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      Catégorie <span className="text-[var(--Flush-Mahogany)]">*</span>
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      Référence interne
                    </label>
                    <input
                      type="text"
                      value={formReference}
                      onChange={(e) => setFormReference(e.target.value)}
                      placeholder="Ex: MAT-BARN-001"
                      className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2 text-sm text-[var(--ink)] focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    Stock initial communal <span className="text-[var(--Flush-Mahogany)]">* (&gt; 0)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2 text-sm text-[var(--ink)] focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none"
                  />
                  {formErrors.stockTotal && (
                    <p className="mt-1 text-xs text-[var(--Flush-Mahogany)]">{formErrors.stockTotal}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Caractéristiques techniques, dimensions, coloris..."
                    className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2 text-sm text-[var(--ink)] focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    Consignes d&apos;utilisation et de transport
                  </label>
                  <textarea
                    rows={2}
                    value={formConsignes}
                    onChange={(e) => setFormConsignes(e.target.value)}
                    placeholder="Précautions d'arrimage, lestage impératif, manipulation..."
                    className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2 text-sm text-[var(--ink)] focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    Photo indicative (JPEG, PNG, WebP)
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setFormPhoto(e.target.files?.[0] ?? null)}
                    className="mt-1.5 w-full text-xs text-[var(--muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--Pale-Sage)] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[var(--Mosaic-Tile)] hover:file:bg-[var(--sage)]"
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="rounded-xl border border-[var(--line)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:bg-[var(--paper)]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="rounded-xl bg-[var(--Mosaic-Tile)] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-[var(--moss)] disabled:opacity-50"
                  >
                    {formSubmitting ? 'Enregistrement...' : 'Enregistrer au catalogue'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal Ajustement de Stock (Scénarios 2 & 3) ─────────────────── */}
        {adjustingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[var(--ink)]">
                    Ajuster le stock
                  </h3>
                  <p className="text-xs text-[var(--muted)]">{adjustingItem.designation}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--paper)]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAdjustSubmit} className="mt-5 space-y-4">
                <div className="rounded-xl bg-[var(--paper)] p-3 text-xs flex justify-between items-center">
                  <span className="font-semibold text-[var(--muted)]">Stock actuel de référence :</span>
                  <span className="text-base font-black text-[var(--ink)]">{adjustingItem.stockTotal} unités</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    Motif de l&apos;ajustement
                  </label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none"
                  >
                    <option value="Entrée de stock">Entrée de stock (nouvel achat communal)</option>
                    <option value="Casse">Casse constatée</option>
                    <option value="Perte">Perte / Vol</option>
                    <option value="Maintenance">Maintenance / Réparation temporaire</option>
                    <option value="Autre">Autre ajustement d&apos;inventaire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    Nouveau stock total <span className="text-[var(--Flush-Mahogany)]">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={adjustNewStock}
                    onChange={(e) => handleStockInputChange(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2 text-sm text-[var(--ink)] focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none"
                  />
                  {adjustChecking && (
                    <p className="mt-1 text-xs text-[var(--muted)]">Vérification de cohérence avec les réservations...</p>
                  )}
                </div>

                {/* ── Scénario 3 : Conflit de surbooking détecté ────────────── */}
                {adjustConflict?.hasConflict && (
                  <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-xs text-[var(--Flush-Mahogany)] space-y-2">
                    <div className="flex items-center gap-2 font-black text-sm">
                      <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      Avertissement de surbooking
                    </div>
                    <p className="leading-relaxed">
                      Le stock demandé ({adjustNewStock}) est inférieur aux réservations fermes validées
                      (jusqu&apos;à {adjustConflict.maxBooked} unités réservées).
                    </p>
                    <div className="rounded-lg bg-white/70 p-2 text-[11px] space-y-1">
                      <p className="font-bold text-[var(--ink)]">Réservations compromises :</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {adjustConflict.conflictingReservations.map((r) => (
                          <li key={r.id}>
                            <strong>{r.association}</strong> : {r.motif} ({r.quantite} unités demandées du{' '}
                            {new Date(r.dateRetrait).toLocaleDateString('fr-FR')} au{' '}
                            {new Date(r.dateRestitution).toLocaleDateString('fr-FR')})
                          </li>
                        ))}
                      </ul>
                    </div>

                    <label className="flex items-start gap-2 pt-2 cursor-pointer font-bold text-[var(--ink)]">
                      <input
                        type="checkbox"
                        checked={adjustForceConfirm}
                        onChange={(e) => setAdjustForceConfirm(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-red-300 text-[var(--Flush-Mahogany)] focus:ring-red-400"
                      />
                      <span>Je confirme explicitement cet ajustement malgré le risque de surbooking.</span>
                    </label>
                  </div>
                )}

                {adjustError && (
                  <p className="text-xs font-semibold text-[var(--Flush-Mahogany)]">{adjustError}</p>
                )}

                <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-4">
                  <button
                    type="button"
                    onClick={() => setAdjustingItem(null)}
                    className="rounded-xl border border-[var(--line)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:bg-[var(--paper)]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={adjustSubmitting}
                    className="rounded-xl bg-[var(--Mosaic-Tile)] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-[var(--moss)] disabled:opacity-50"
                  >
                    {adjustSubmitting ? 'Mise à jour...' : 'Valider le nouveau stock'}
                  </button>
                </div>
              </form>
            </div>
          </div>
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
