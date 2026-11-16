'use client';

interface EquipmentFiltersProps {
  search: string;
  category: string;
  status: 'all' | 'available' | 'archived';
  categories: Array<{ value: string; label: string }>;
  onSearch: (value: string) => void;
  onCategory: (value: string) => void;
  onStatus: (value: 'all' | 'available' | 'archived') => void;
}

export default function EquipmentFilters({ search, category, status, categories, onSearch, onCategory, onStatus }: EquipmentFiltersProps) {
  return <section aria-labelledby="filters-heading" className="rounded-2xl border border-line bg-white p-5 shadow-sm"><h2 id="filters-heading" className="sr-only">Filtres de recherche</h2><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><label className="text-xs font-bold uppercase tracking-wider text-muted">Rechercher<input id="search-input" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Désignation, référence interne..." className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3.5 py-2 text-sm font-normal normal-case text-ink" /></label><label className="text-xs font-bold uppercase tracking-wider text-muted">Catégorie<select value={category} onChange={(event) => onCategory(event.target.value)} className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3.5 py-2 text-sm font-normal normal-case text-ink">{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="text-xs font-bold uppercase tracking-wider text-muted">Statut catalogue<select value={status} onChange={(event) => onStatus(event.target.value as EquipmentFiltersProps['status'])} className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3.5 py-2 text-sm font-normal normal-case text-ink"><option value="all">Tous les équipements</option><option value="available">Disponibles uniquement</option><option value="archived">Archivés uniquement</option></select></label></div></section>;
}
