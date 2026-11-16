/**
 * Session du navigateur.
 * - Le JWT vit dans un cookie HttpOnly posé par l'API : JavaScript ne peut ni le lire ni le voler.
 * - Le navigateur ne garde ici qu'un profil d'affichage (noms, rôles, modules), sans valeur de
 *   sécurité : c'est l'API qui décide, et un 401 efface ce profil.
 * - Un seul espace connecté à la fois : ouvrir une session association ferme la session mairie.
 */

export type SessionKind = 'association' | 'admin';

export interface AssociationModulesFlags {
  subventions: boolean;
  materiel: boolean;
  salles: boolean;
  evenements: boolean;
}

/** Profil renvoyé par l'API à la connexion et par GET /api/auth/session. */
export interface SessionUser {
  id: number;
  email: string;
  nom: string | null;
  prenom: string | null;
  roles: string[];
  typeCompte: string;
  nomAssociation: string | null;
  logoUrl?: string | null;
  modules: AssociationModulesFlags | null;
}

export interface StoredSession {
  kind: SessionKind;
  user: SessionUser;
}

const SESSION_KEY = 'session';
/** Clés des versions précédentes, où le JWT était lisible dans localStorage. */
const LEGACY_KEYS = ['token', 'admin_token', 'association_name', 'admin_name', 'user_name', 'user_prenom', 'user_nom'];

function notifyAuthChange(): void {
  window.dispatchEvent(new Event('auth-change'));
}

export function readSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const session = raw ? (JSON.parse(raw) as StoredSession) : null;
    return session?.user && (session.kind === 'association' || session.kind === 'admin') ? session : null;
  } catch {
    return null;
  }
}

/** Valeur stable pour useSyncExternalStore : la chaîne brute change seulement à la connexion. */
export function readSessionSnapshot(): string | null {
  return typeof window === 'undefined' ? null : localStorage.getItem(SESSION_KEY);
}

export function subscribeSession(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  window.addEventListener('auth-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('auth-change', callback);
  };
}

export function storeSession(kind: SessionKind, user: SessionUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ kind, user } satisfies StoredSession));
  notifyAuthChange();
}

/** Photo changée depuis le profil : la navigation l'affiche sans reconnexion. */
export function updateSessionLogo(logoUrl: string | null): void {
  const session = readSession();
  if (session) storeSession(session.kind, { ...session.user, logoUrl });
}

export function clearSessions(): void {
  localStorage.removeItem(SESSION_KEY);
  LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
  notifyAuthChange();
}

export function hasSession(kind: SessionKind): boolean {
  return readSession()?.kind === kind;
}
