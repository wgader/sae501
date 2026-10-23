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
      }
    } catch (error) {
      console.warn('Impossible de décoder le nom de l’association depuis le token:', error);
    }
  }

  return 'Feytiat Loisirs';
}

export function getStoredUserNames(): { prenom: string; nom: string } {
  if (typeof window === 'undefined') return { prenom: '', nom: '' };

  const storedPrenom = localStorage.getItem('user_prenom');
  const storedNom = localStorage.getItem('user_nom');
  if (storedPrenom || storedNom) {
    return {
      prenom: (storedPrenom || '').trim(),
      nom: (storedNom || '').trim(),
    };
  }

  const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const prenom = typeof payload.prenom === 'string' ? payload.prenom.trim() : '';
        const nom = typeof payload.nom === 'string' ? payload.nom.trim() : '';
        if (prenom || nom) {
          return { prenom, nom };
        }
      }
    } catch (error) {
      console.warn('Impossible de décoder le profil utilisateur depuis le token:', error);
    }
  }

  return { prenom: '', nom: '' };
}

export function getStoredUserName(): string {
  if (typeof window === 'undefined') return '';

  const { prenom, nom } = getStoredUserNames();
  const fullName = [prenom, nom].filter(Boolean).join(' ');
  if (fullName.trim()) return fullName.trim();

  const stored = localStorage.getItem('user_name') || localStorage.getItem('admin_name');
  if (stored && stored.trim() && !stored.includes('@')) {
    return stored.trim();
  }

  return '';
}

export function getPersonInitials(prenom?: string | null, nom?: string | null): string {
  const p = prenom?.trim();
  const n = nom?.trim();

  if (p && n) {
    return `${p[0]}${n[0]}`.toUpperCase();
  }
  if (p) {
    return p.slice(0, 2).toUpperCase();
  }
  if (n) {
    return n.slice(0, 2).toUpperCase();
  }
  return '';
}

export function getAssociationInitials(name: string): string {
  if (!name) return 'AS';
  const clean = name.replace(/^(l'|le|la|les|association)\s+/i, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || 'AS';
}

export function getUserInitials(nameOrPrenom?: string | null, optionalNom?: string | null): string {
  if (optionalNom) {
    const initials = getPersonInitials(nameOrPrenom, optionalNom);
    if (initials) return initials;
  }

  if (!nameOrPrenom || !nameOrPrenom.trim()) return 'PR';
  const clean = nameOrPrenom.trim();
  if (clean.includes('@')) return 'PR';

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}
