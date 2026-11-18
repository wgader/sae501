'use client';

import { useEffect, useMemo, useState } from 'react';
import EquipmentCatalogCard from '@/components/equipment/EquipmentCatalogCard';
import EquipmentCatalogFilters from '@/components/equipment/EquipmentCatalogFilters';
import Notice from '@/components/ui/Notice';
import { Equipment, getPublicEquipment } from '@/lib/api';
import { getEquipmentCategoryLabel } from '@/lib/equipmentCategories';

export default function MaterielPage() {
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

  const categories = useMemo(() => {
    const values = Array.from(
      new Set(equipmentList.map((item) => item.categorie.trim()).filter(Boolean)),
    ).sort((first, second) => first.localeCompare(second, 'fr'));

    return [
      { value: '', label: 'Toutes les catégories' },
      ...values.map((value) => ({ value, label: getEquipmentCategoryLabel(value) })),
    ];
  }, [equipmentList]);

  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-328 space-y-8">
        <header className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-label font-bold uppercase tracking-eyebrow text-primary">
              S&apos;équiper
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-display text-ink">
              Demande de matériel
            </h1>
            <p className="mt-2 max-w-2xl text-body leading-copy text-muted">
              Consultez les équipements municipaux disponibles au prêt pour vos manifestations et événements associatifs.
            </p>
          </div>
        </header>

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
