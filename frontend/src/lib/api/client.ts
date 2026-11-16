export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

export function getMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly data?: unknown) {
    super(message);
  }
}

export function redirectToAdminLogin(): never {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('token');
  window.location.replace('/admin');
  throw new ApiError('Redirection vers la connexion administrateur.', 401);
}

export function redirectToAssociationLogin(): never {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('association_name');
    window.dispatchEvent(new Event('auth-change'));
    window.location.replace('/connexion');
  }
  throw new ApiError('Votre session a expiré. Redirection vers la page de connexion...', 401);
}

function getToken(): string {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  if (!token) return redirectToAdminLogin();
  return token;
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  const data = await response.json().catch(() => null);
  if (response.status === 401) redirectToAdminLogin();
  if (!response.ok) {
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : 'Une erreur est survenue.',
      response.status,
      data,
    );
  }
  return data as T;
}

export async function accountRequest<T>(
  path: string,
  options: RequestInit = {},
  defaultErrorMessage = 'Une erreur est survenue lors de la communication avec le serveur.',
): Promise<T> {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('token') || localStorage.getItem('admin_token'))
    : null;
  if (!token) {
    return redirectToAssociationLogin();
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);

  if (response.status === 401) {
    return redirectToAssociationLogin();
  }

  if (!response.ok) {
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : defaultErrorMessage,
      response.status,
      data,
    );
  }

  return data as T;
}

export async function requestBlob(path: string): Promise<Blob> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: 'application/octet-stream',
      Authorization: 'Bearer ' + token,
    },
  });
  if (response.status === 401) redirectToAssociationLogin();
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
