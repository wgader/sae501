import { clearSessions, readSession } from '@/lib/session';

/** Les fichiers déposés sont servis par le même domaine que le site : un chemin relatif suffit. */
export function getMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return path.startsWith('/') ? path : `/${path}`;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly data?: unknown) {
    super(message);
  }
}

export function redirectToAdminLogin(): never {
  clearSessions();
  window.location.replace('/admin');
  throw new ApiError('Redirection vers la connexion administrateur.', 401);
}

export function redirectToAssociationLogin(): never {
  if (typeof window !== 'undefined') {
    clearSessions();
    window.location.replace('/connexion');
  }
  throw new ApiError('Votre session a expiré. Redirection vers la page de connexion...', 401);
}

/**
 * Appel à l'API avec la session du navigateur : le cookie HttpOnly part automatiquement
 * (credentials) et l'en-tête X-Requested-With est exigé par la protection CSRF de l'API.
 */
export function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
  // Un envoi de fichier laisse le navigateur poser le multipart et sa frontière.
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(path, {
    ...options,
    credentials: 'include',
    headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
  });
}

async function readJson<T>(response: Response, defaultErrorMessage: string): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(typeof data?.message === 'string' ? data.message : defaultErrorMessage, response.status, data);
  }
  return data as T;
}

/** Session absente ou expirée : retour à la page de connexion de l'espace concerné. */
function redirectToLogin(): never {
  return readSession()?.kind === 'association' ? redirectToAssociationLogin() : redirectToAdminLogin();
}

/** Appel authentifié commun aux deux espaces. */
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!readSession()) return redirectToLogin();
  const response = await apiFetch(path, options);
  if (response.status === 401) return redirectToLogin();
  return readJson<T>(response, 'Une erreur est survenue.');
}

/** Appel public : aucune vérification ni redirection liée à une session locale. */
export async function publicRequest<T>(
  path: string,
  options: RequestInit = {},
  defaultErrorMessage = 'Une erreur est survenue.',
): Promise<T> {
  const response = await apiFetch(path, options);
  return readJson<T>(response, defaultErrorMessage);
}

/** Appel de l'espace association : sans session, retour à la connexion association. */
export async function accountRequest<T>(
  path: string,
  options: RequestInit = {},
  defaultErrorMessage = 'Une erreur est survenue lors de la communication avec le serveur.',
): Promise<T> {
  if (!readSession()) return redirectToAssociationLogin();
  const response = await apiFetch(path, options);
  if (response.status === 401) return redirectToAssociationLogin();
  return readJson<T>(response, defaultErrorMessage);
}

export async function requestBlob(path: string): Promise<Blob> {
  const response = await apiFetch(path, { headers: { Accept: 'application/octet-stream' } });
  if (response.status === 401) return redirectToLogin();
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : 'Impossible de télécharger le fichier.',
      response.status,
      data,
    );
  }
  return response.blob();
}

export async function downloadPrivateDocument(path: string, filename = 'document'): Promise<void> {
  const blob = await requestBlob(path);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
