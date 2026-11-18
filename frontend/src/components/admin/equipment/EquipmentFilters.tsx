'use client';

import { fieldControlVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';

export type EquipmentStatusFilter = 'all' | 'available' | 'archived';

interface EquipmentFiltersProps {
  search: string;
  category: string;
  status: EquipmentStatusFilter;
  categories: ReadonlyArray<{ value: string; label: string }>;
  onSearch: (value: string) => void;
  onCategory: (value: string) => void;
  onStatus: (value: EquipmentStatusFilter) => void;
}

export default function EquipmentFilters({ search, category, status, categories, onSearch, onCategory, onStatus }: EquipmentFiltersProps) {
  return (
    <section aria-labelledby="equipment-filters-title" className="grid gap-4 sm:grid-cols-3">
      <h2 id="equipment-filters-title" className="sr-only">
        Filtres de recherche
      </h2>
      <div>
        <label htmlFor="equipment-search" className={fieldLabelVariants()}>
          Rechercher
        </label>
        <input
          id="equipment-search"
          type="search"
          value={search}
          placeholder="Désignation, référence…"
          onChange={(event) => onSearch(event.target.value)}
          className={fieldControlVariants()}
        />
      </div>
      <div>
        <label htmlFor="equipment-category" className={fieldLabelVariants()}>
          Catégorie
        </label>
        <select id="equipment-category" value={category} onChange={(event) => onCategory(event.target.value)} className={fieldControlVariants()}>
          <option value="">Toutes les catégories</option>
          {categories.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="equipment-status" className={fieldLabelVariants()}>
          Statut
        </label>
        <select
          id="equipment-status"
          value={status}
          onChange={(event) => onStatus(event.target.value as EquipmentStatusFilter)}
          className={fieldControlVariants()}
        >
          <option value="all">Tous les équipements</option>
          <option value="available">Disponibles uniquement</option>
          <option value="archived">Archivés uniquement</option>
        </select>
      </div>
    </section>
  );
}
