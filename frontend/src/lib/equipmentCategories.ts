export const EQUIPMENT_CATEGORIES = [
  { value: 'mobilier', label: 'Mobilier' },
  { value: 'sonorisation', label: 'Sonorisation & Audio' },
  { value: 'barnums', label: 'Barnums & Tentes' },
  { value: 'eclairage', label: 'Éclairage' },
  { value: 'autre', label: 'Autre matériel' },
] as const;

export function getEquipmentCategoryLabel(category: string): string {
  const known = EQUIPMENT_CATEGORIES.find((item) => item.value === category);
  return known?.label ?? category.charAt(0).toUpperCase() + category.slice(1);
}
