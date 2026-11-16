/**
 * Sessions stockées dans le navigateur : un seul espace connecté à la fois.
 * Ouvrir une session association ferme la session mairie (et inversement), sinon une déconnexion
 * de l'une laisserait l'autre active et renverrait vers le mauvais espace.
 */

const ASSOCIATION_KEYS = ['token', 'association_name'] as const;
const ADMIN_KEYS = ['admin_token', 'admin_name'] as const;

function notifyAuthChange(): void {
  window.dispatchEvent(new Event('auth-change'));
}

function removeKeys(keys: readonly string[]): void {
  keys.forEach((key) => localStorage.removeItem(key));
}

export function storeAssociationSession(token: string, associationName?: string | null): void {
  removeKeys(ADMIN_KEYS);
  localStorage.setItem('token', token);
  if (associationName) {
    localStorage.setItem('association_name', associationName);
  } else {
    localStorage.removeItem('association_name');
  }
  notifyAuthChange();
}

export function storeAdminSession(token: string): void {
  removeKeys(ASSOCIATION_KEYS);
  localStorage.setItem('admin_token', token);
  notifyAuthChange();
}

export function clearSessions(): void {
  removeKeys([...ASSOCIATION_KEYS, ...ADMIN_KEYS]);
  notifyAuthChange();
}
