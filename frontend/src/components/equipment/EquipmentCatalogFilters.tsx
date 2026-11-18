import { fieldControlVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';

interface EquipmentCatalogFiltersProps {
  search: string;
  category: string;
  categories: { value: string; label: string }[];
  onSearch: (value: string) => void;
  onCategory: (value: string) => void;
}

export default function EquipmentCatalogFilters({ search, category, categories, onSearch, onCategory }: EquipmentCatalogFiltersProps) {
  return (
    <section aria-labelledby="catalog-filters" className="grid gap-4 sm:grid-cols-2">
      <h2 id="catalog-filters" className="sr-only">
        Filtrer les équipements
      </h2>
      <div>
        <label htmlFor="catalog-search" className={fieldLabelVariants()}>
          Rechercher un matériel
        </label>
        <input
          id="catalog-search"
          type="search"
          value={search}
          placeholder="Ex : barnum, table, micro…"
          onChange={(event) => onSearch(event.target.value)}
          className={fieldControlVariants()}
        />
      </div>
      <div>
        <label htmlFor="catalog-category" className={fieldLabelVariants()}>
          Catégorie
        </label>
        <select id="catalog-category" value={category} onChange={(event) => onCategory(event.target.value)} className={fieldControlVariants()}>
          {categories.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
