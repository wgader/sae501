/** Libellé de secours, le temps que la liste des catégories réglées par la mairie arrive. */
export function fallbackCategoryLabel(code: string): string {
  const words = code.replaceAll('-', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
