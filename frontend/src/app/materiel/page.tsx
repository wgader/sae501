'use client';

import { useEffect, useMemo, useState } from 'react';
import ModulePageHeader from '@/components/ui/ModulePageHeader';
import { EQUIPMENT_STEPS } from '@/lib/moduleGuides';
import EquipmentCatalogCard from '@/components/equipment/EquipmentCatalogCard';
import EquipmentCatalogFilters from '@/components/equipment/EquipmentCatalogFilters';
import Notice from '@/components/ui/Notice';
import { Equipment, getPublicEquipment } from '@/lib/api';
import { useEquipmentCategories } from '@/hooks/useEquipmentCategories';

export default function MaterielPage() {
  const { labelOf } = useEquipmentCategories();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        setError(null);
        setEquipmentList(await getPublicEquipment());
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Impossible de charger le catalogue de matériel.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return equipmentList.filter((item) => {
      if (selectedCategory && item.categorie !== selectedCategory) return false;
      if (!query) return true;

      return (
        item.designation.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) === true
      );
    });
  }, [equipmentList, search, selectedCategory]);

  // Seules les catégories qui contiennent du matériel sont proposées en filtre.
  const categories = useMemo(() => {
    const values = Array.from(new Set(equipmentList.map((item) => item.categorie.trim()).filter(Boolean)))
      .map((value) => ({ value, label: labelOf(value) }))
      .sort((first, second) => first.label.localeCompare(second.label, 'fr'));

    return [{ value: '', label: 'Toutes les catégories' }, ...values];
  }, [equipmentList, labelOf]);

  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-328 space-y-8">
        <ModulePageHeader
          module="equipment"
          title="Demande de matériel"
          lead="La mairie prête gratuitement son matériel aux associations pour leurs manifestations : tables, barnums, sonorisation, signalétique…"
          steps={EQUIPMENT_STEPS}
        />

        <EquipmentCatalogFilters
          search={search}
          category={selectedCategory}
          categories={categories}
          onSearch={setSearch}
          onCategory={setSelectedCategory}
        />

        <section aria-labelledby="catalog-items-heading">
          <h2 id="catalog-items-heading" className="sr-only">
            Équipements disponibles
          </h2>

          {loading && (
            <p role="status" className="py-16 text-center text-body-sm text-muted">
              Chargement des équipements…
            </p>
          )}
          {error && <Notice tone="danger">{error}</Notice>}
          {!loading && !error && filtered.length === 0 && (
            <p className="rounded-card border border-dashed border-line px-6 py-12 text-center text-body-sm text-muted">
              Aucun équipement ne correspond à votre recherche.
            </p>
          )}
          {!loading && !error && filtered.length > 0 && (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <li key={item.id} className="flex">
                  <EquipmentCatalogCard equipment={item} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
