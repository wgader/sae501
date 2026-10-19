export function getStoredAssociationName(): string {
  if (typeof window === 'undefined') return 'Feytiat Loisirs';

  // 1. Check explicit association_name stored in localStorage
  const stored = localStorage.getItem('association_name');
  if (stored) {
    if (stored.includes('@')) {
      // Purge accidental email stored as name
      localStorage.removeItem('association_name');
    } else if (stored.trim()) {
      return stored.trim();
    }
  }

  // 2. Decode from JWT token
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (
          payload.nomAssociation &&
          typeof payload.nomAssociation === 'string' &&
          payload.nomAssociation.trim() &&
          !payload.nomAssociation.includes('@')
        ) {
          return payload.nomAssociation.trim();
        }
        // If username is a human name and not an email
        if (
          payload.username &&
          typeof payload.username === 'string' &&
          !payload.username.includes('@')
        ) {
          return payload.username.trim();
        }
      }
    } catch {
      // fallback
    }
  }

  return 'Feytiat Loisirs';
}

export function getAssociationInitials(name: string): string {
  if (!name) return 'AF';
  const clean = name.replace(/^(l'|le|la|les|association)\s+/i, '').trim();
  const words = clean.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || 'AF';
}
