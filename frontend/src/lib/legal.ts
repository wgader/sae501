export function formatLegalSectionTitle(title: string, index: number): string {
  const cleanTitle = title
    .trim()
    .replace(/^(?:(?:article|section)\s+)?\d+(?:\.\d+)*(?:\s*[.)\-:]|\s+)\s*/i, '')
    .trim();

  return cleanTitle ? `${index + 1}. ${cleanTitle}` : `${index + 1}.`;
}
