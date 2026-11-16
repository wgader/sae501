import { readSession } from '@/lib/session';

/** Nom de l'association connectée, lu dans le profil de session (jamais dans le JWT). */
export function getStoredAssociationName(): string {
  const name = readSession()?.user.nomAssociation?.trim();
  return name && !name.includes('@') ? name : 'Feytiat Loisirs';
}

export function getStoredUserNames(): { prenom: string; nom: string } {
  const user = readSession()?.user;
  return { prenom: user?.prenom?.trim() ?? '', nom: user?.nom?.trim() ?? '' };
}

export function getStoredUserName(): string {
  const { prenom, nom } = getStoredUserNames();
  return [prenom, nom].filter(Boolean).join(' ');
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
