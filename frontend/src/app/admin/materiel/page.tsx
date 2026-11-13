'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import EquipmentFormModal from '@/components/admin/EquipmentFormModal';
import EquipmentStockModal from '@/components/admin/EquipmentStockModal';
import EquipmentSectionSwitcher from '@/components/admin/equipment/EquipmentSectionSwitcher';
import EquipmentFilters from '@/components/admin/equipment/EquipmentFilters';
import EquipmentInventory from '@/components/admin/equipment/EquipmentInventory';
import { Equipment, deleteAdminEquipment, getAdminEquipment } from '@/lib/api';

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
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'archived'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<Equipment | null>(null);
  const [archivingItem, setArchivingItem] = useState<Equipment | null>(null);

  const loadData = useCallback(async () => {
    try { setLoading(true); setError(null); setEquipmentList(await getAdminEquipment()); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Erreur de chargement du matériel.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const filteredList = useMemo(() => equipmentList.filter((item) => {
    if (selectedCategory && item.categorie !== selectedCategory) return false;
    if (statusFilter === 'available' && item.isArchived || statusFilter === 'archived' && !item.isArchived) return false;
    const query = search.trim().toLowerCase();
    return !query || item.designation.toLowerCase().includes(query) || Boolean(item.referenceInterne?.toLowerCase().includes(query));
  }), [equipmentList, search, selectedCategory, statusFilter]);

  function showToast(type: 'success' | 'error', message: string) {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback(null), 5000);
  }
  function handleSaved(saved: Equipment, wasEditing: boolean) {
    setEquipmentList((current) => wasEditing ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
    setIsCreateOpen(false); setEditingItem(null);
    showToast('success', wasEditing ? `L'équipement « ${saved.designation} » a été modifié.` : `L'équipement « ${saved.designation} » a été ajouté.`);
  }
  async function handleArchive() {
    if (!archivingItem) return;
    try { const result = await deleteAdminEquipment(archivingItem.id); setEquipmentList((current) => current.map((item) => item.id === archivingItem.id ? result.equipment : item)); showToast('success', `L'équipement « ${archivingItem.designation} » a été archivé.`); setArchivingItem(null); }
    catch (requestError) { showToast('error', requestError instanceof Error ? requestError.message : 'Erreur lors de l’archivage.'); }
  }

  return <AdminLayout><div className="mx-auto max-w-6xl space-y-8">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><AdminPageHeader title="Parc Matériel" description="Gestion du stock communal d'équipements municipaux, ajustement des disponibilités et archivage logique."><EquipmentSectionSwitcher /></AdminPageHeader><button type="button" onClick={() => { setEditingItem(null); setIsCreateOpen(true); }} className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white">Ajouter un équipement</button></header>
    {feedback && <div role="status" className={`rounded-xl border p-4 text-sm font-semibold ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-danger'}`}>{feedback.message}</div>}
    <EquipmentFilters search={search} category={selectedCategory} status={statusFilter} categories={CATEGORIES} onSearch={setSearch} onCategory={setSelectedCategory} onStatus={setStatusFilter} />
    <section aria-labelledby="equipment-list-heading"><h2 id="equipment-list-heading" className="sr-only">Inventaire du matériel</h2><EquipmentInventory items={filteredList} loading={loading} error={error} brokenImageIds={brokenImageIds} onBrokenImage={(id) => setBrokenImageIds((current) => current.includes(id) ? current : [...current, id])} onAdjust={setAdjustingItem} onEdit={(item) => { setEditingItem(item); setIsCreateOpen(true); }} onArchive={setArchivingItem} /></section>
    {isCreateOpen && <EquipmentFormModal key={editingItem?.id ?? 'new-equipment'} isOpen editingItem={editingItem} onClose={() => { setIsCreateOpen(false); setEditingItem(null); }} onSaved={handleSaved} onError={(message) => showToast('error', message)} />}
    {adjustingItem && <EquipmentStockModal key={adjustingItem.id} equipment={adjustingItem} onClose={() => setAdjustingItem(null)} onSaved={(updated) => { setEquipmentList((current) => current.map((item) => item.id === updated.id ? updated : item)); setAdjustingItem(null); showToast('success', `Stock mis à jour pour « ${updated.designation} ».`); }} onError={(message) => showToast('error', message)} />}
    {archivingItem && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h3 className="text-lg font-bold text-ink">Archiver l&apos;équipement ?</h3><p className="mt-2 text-xs text-muted">Vous êtes sur le point d&apos;archiver <strong>« {archivingItem.designation} »</strong>. Il restera conservé dans les dossiers passés.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setArchivingItem(null)} className="rounded-xl border border-line px-4 py-2 text-xs font-bold uppercase text-muted">Annuler</button><button type="button" onClick={handleArchive} className="rounded-xl bg-danger px-5 py-2 text-xs font-bold uppercase text-white">Confirmer l&apos;archivage</button></div></div></div>}
  </div></AdminLayout>;
}
