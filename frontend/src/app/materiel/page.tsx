'use client';

import { useEffect, useMemo, useState } from 'react';
import EquipmentCatalogCard from '@/components/equipment/EquipmentCatalogCard';
import { Equipment, getPublicEquipment } from '@/lib/api';

const CATEGORY_LABELS: Record<string, string> = {
  mobilier: 'Mobilier',
  sonorisation: 'Sonorisation & Audio',
  barnums: 'Barnums & Tentes',
  eclairage: 'Éclairage',
  autre: 'Autre matériel',
};

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}

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
      ...values.map((value) => ({ value, label: getCategoryLabel(value) })),
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
            <h1 className="mt-2 text-4xl font-black tracking-display text-ink sm:text-5xl">
              Demande de matériel
            </h1>
            <p className="mt-2 max-w-2xl text-body leading-copy text-muted">
              Consultez les équipements municipaux disponibles au prêt pour vos manifestations et événements associatifs.
            </p>
          </div>
        </header>

        <section aria-labelledby="catalog-filters" className="rounded-2xl border border-line bg-paper p-5">
          <h2 id="catalog-filters" className="sr-only">
            Filtrer les équipements
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="catalog-search" className="block text-xs font-bold uppercase tracking-wider text-muted">
                Rechercher un matériel
              </label>
              <input
                id="catalog-search"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ex: Barnum, table, micro..."
                className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2 text-sm text-ink focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="catalog-cat" className="block text-xs font-bold uppercase tracking-wider text-muted">
                Catégorie
              </label>
              <select
                id="catalog-cat"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2 text-sm text-ink focus:border-primary focus:outline-none"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section aria-labelledby="catalog-items-heading">
          <h2 id="catalog-items-heading" className="sr-only">
            Équipements disponibles
          </h2>

          {loading ? (
            <div className="rounded-2xl border border-line bg-paper p-12 text-center text-sm font-semibold text-muted">
              Chargement des équipements disponibles...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-danger">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-line bg-paper p-12 text-center">
              <p className="text-base font-bold text-ink">Aucun équipement disponible</p>
              <p className="mt-1 text-xs text-muted">
                Modifiez vos filtres ou contactez le service logistique municipal pour toute demande spécifique.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filtered.map((item) => (
                <EquipmentCatalogCard key={item.id} equipment={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
