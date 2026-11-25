'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import EquipmentFormModal from '@/components/admin/EquipmentFormModal';
import EquipmentStockModal from '@/components/admin/EquipmentStockModal';
import EquipmentArchiveDialog from '@/components/admin/equipment/EquipmentArchiveDialog';
import EquipmentFilters, { type EquipmentStatusFilter } from '@/components/admin/equipment/EquipmentFilters';
import EquipmentInventory from '@/components/admin/equipment/EquipmentInventory';
import EquipmentSectionTabs from '@/components/admin/equipment/EquipmentSectionTabs';
import Button from '@/components/ui/Button';
import Notice from '@/components/ui/Notice';
import { IconPlus } from '@/components/ui/icons';
import { Equipment, deleteAdminEquipment, getAdminEquipment } from '@/lib/api';
import { useEquipmentCategories } from '@/hooks/useEquipmentCategories';

type Feedback = { tone: 'success' | 'danger'; message: string };

export default function AdminMaterielPage() {
  const { categories } = useEquipmentCategories();
  const categoryOptions = categories.map(({ code, label }) => ({ value: code, label }));
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [brokenImageIds, setBrokenImageIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatusFilter>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<Equipment | null>(null);
  const [archivingItem, setArchivingItem] = useState<Equipment | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setEquipmentList(await getAdminEquipment());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Erreur de chargement du matériel.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const filteredList = useMemo(() => {
    const query = search.trim().toLowerCase();
    return equipmentList.filter((item) => {
      if (selectedCategory && item.categorie !== selectedCategory) return false;
      if (statusFilter === 'available' && item.isArchived) return false;
      if (statusFilter === 'archived' && !item.isArchived) return false;
      return !query || item.designation.toLowerCase().includes(query) || Boolean(item.referenceInterne?.toLowerCase().includes(query));
    });
  }, [equipmentList, search, selectedCategory, statusFilter]);

  const showFeedback = (tone: Feedback['tone'], message: string) => {
    setFeedback({ tone, message });
    window.setTimeout(() => setFeedback(null), 5000);
  };

  const replaceItem = (updated: Equipment) => {
    setEquipmentList((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleSaved = (saved: Equipment, wasEditing: boolean) => {
    if (wasEditing) replaceItem(saved);
    else setEquipmentList((current) => [saved, ...current]);
    closeForm();
    showFeedback('success', `L’équipement « ${saved.designation} » a été ${wasEditing ? 'modifié' : 'ajouté'}.`);
  };

  const handleArchive = async () => {
    if (!archivingItem) return;
    try {
      const result = await deleteAdminEquipment(archivingItem.id);
      replaceItem(result.equipment);
      showFeedback('success', `L’équipement « ${archivingItem.designation} » a été archivé.`);
    } catch (requestError) {
      showFeedback('danger', requestError instanceof Error ? requestError.message : 'Erreur lors de l’archivage.');
    } finally {
      setArchivingItem(null);
    }
  };

  return (
    <AdminLayout>
      <section className="mx-auto max-w-328 space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <AdminPageHeader
            title="GESTION DU MATÉRIEL"
            description="Gérez le parc communal, les durées d’emprunt et les demandes des associations."
          />
          <Button
            rightIcon={<IconPlus className="h-4 w-4" />}
            onClick={() => {
              setEditingItem(null);
              setIsFormOpen(true);
            }}
          >
            Ajouter un équipement
          </Button>
        </header>

        <EquipmentSectionTabs />

        {feedback && <Notice tone={feedback.tone}>{feedback.message}</Notice>}

        <EquipmentFilters
          search={search}
          category={selectedCategory}
          status={statusFilter}
          categories={categoryOptions}
          onSearch={setSearch}
          onCategory={setSelectedCategory}
          onStatus={setStatusFilter}
        />

        <section aria-labelledby="equipment-list-heading">
          <h2 id="equipment-list-heading" className="sr-only">
            Inventaire du matériel
          </h2>
          <EquipmentInventory
            items={filteredList}
            loading={loading}
            error={error}
            brokenImageIds={brokenImageIds}
            onBrokenImage={(id) => setBrokenImageIds((current) => (current.includes(id) ? current : [...current, id]))}
            onAdjust={setAdjustingItem}
            onEdit={(item) => {
              setEditingItem(item);
              setIsFormOpen(true);
            }}
            onArchive={setArchivingItem}
          />
        </section>

        {isFormOpen && (
          <EquipmentFormModal
            key={editingItem?.id ?? 'new-equipment'}
            isOpen
            editingItem={editingItem}
            onClose={closeForm}
            onSaved={handleSaved}
            onError={(message) => showFeedback('danger', message)}
          />
        )}
        {adjustingItem && (
          <EquipmentStockModal
            key={adjustingItem.id}
            equipment={adjustingItem}
            onClose={() => setAdjustingItem(null)}
            onSaved={(updated) => {
              replaceItem(updated);
              setAdjustingItem(null);
              showFeedback('success', `Stock mis à jour pour « ${updated.designation} ».`);
            }}
            onError={(message) => showFeedback('danger', message)}
          />
        )}
        <EquipmentArchiveDialog item={archivingItem} onCancel={() => setArchivingItem(null)} onConfirm={() => void handleArchive()} />
      </section>
    </AdminLayout>
  );
}
