import { accountRequest, apiFetch, API_URL, ApiError, requestBlob } from './client';
import { clearSessions, storeSession, updateSessionLogo, type SessionKind, type SessionUser } from '@/lib/session';
import type { ExternalEventFile } from './evenements';
import type {
  AccountProfile,
  EventAnnexes,
  RequestDocument,
  AssociationRequestDetail,
  AssociationRequestsResponse,
} from './types';

export function getAccountProfile(): Promise<AccountProfile> {
  return accountRequest<AccountProfile>(
    '/api/account/profile',
    {},
    'Impossible de charger les informations du profil.',
  );
}

export function updateAccountProfile(payload: {
  email?: string;
  telephone?: string | null;
}): Promise<AccountProfile> {
  return accountRequest<AccountProfile>(
    '/api/account/profile',
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    'Impossible de mettre à jour le profil.',
  );
}

export function getAssociationRequests(filters?: {
  status?: string;
  type?: string;
  year?: string | number;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<AssociationRequestsResponse> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.type) params.set('type', filters.type);
  if (filters?.year) params.set('year', String(filters.year));
  if (filters?.search) params.set('search', filters.search);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  const qs = params.toString();
  return accountRequest<AssociationRequestsResponse>(
    `/api/association/requests${qs ? `?${qs}` : ''}`,
    {},
    'Impossible de récupérer la liste des démarches.',
  );
}

export function getAssociationRequestDetail(
  id: string,
  type?: string
): Promise<AssociationRequestDetail> {
  const qs = type ? `?type=${encodeURIComponent(type)}` : '';
  return accountRequest<AssociationRequestDetail>(
    `/api/association/requests/${encodeURIComponent(id)}${qs}`,
    {},
    'Impossible de charger le détail du dossier.',
  );
}

export function uploadAssociationRequestDocument(
  id: string,
  type: 'materiel' | 'salle',
  file: File,
  typeDocument?: string,
): Promise<RequestDocument> {
  const body = new FormData();
  body.append('file', file);
  body.append('type', type);
  if (typeDocument) body.append('typeDocument', typeDocument);
  return accountRequest<RequestDocument>(
    `/api/association/requests/${encodeURIComponent(id)}/documents`,
    { method: 'POST', body },
    'Impossible de déposer cette pièce.',
  );
}

export async function getAssociationEventAnnexes(eventId: number): Promise<EventAnnexes> {
  const detail = await getAssociationRequestDetail(`event-${eventId}`, 'evenement');
  return {
    event: detail,
    files: detail.files ?? [],
    missingFiles: detail.missingFiles ?? [],
    documentsRequestMessage: detail.documentsRequestMessage ?? null,
    documentsRequestedAt: detail.documentsRequestedAt ?? null,
  };
}

export function uploadAssociationEventFile(eventId: number, file: File): Promise<ExternalEventFile> {
  const body = new FormData();
  body.append('file', file);
  return accountRequest<ExternalEventFile>(
    `/api/events/${eventId}/files`,
    { method: 'POST', body },
    'Impossible de déposer cette pièce.',
  );
}

export async function downloadAssociationEventFile(fileId: number): Promise<Blob> {
  return requestBlob(`/api/events/association/files/${fileId}`);
}

export function cancelAssociationRequest(
  id: string,
  type: 'materiel' | 'salle',
): Promise<{ id: string; type: string; statut: string; updatedAt: string | null }> {
  return accountRequest(
    `/api/association/requests/${encodeURIComponent(id)}/cancel`,
    { method: 'POST', body: JSON.stringify({ type }) },
    'Impossible d’annuler cette réservation.',
  );
}

export async function registerAssociation(payload: {
  nomAssociation: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  cguAccepted: boolean;
}): Promise<void> {
  const response = await fetch(`${API_URL}/api/auth/register/association`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : 'Une erreur est survenue.',
      response.status,
    );
  }
}

/** Appel public (sans session) : renvoie le JSON ou lève une ApiError avec le message du serveur. */
async function publicAuthRequest<T>(path: string, payload: Record<string, string>, fallbackMessage: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const errors = Array.isArray(data?.errors) ? (data.errors as string[]).join(' ') : null;
    throw new ApiError(errors ?? (typeof data?.message === 'string' ? data.message : fallbackMessage), response.status, data);
  }
  return data as T;
}

/** Demande un lien de réinitialisation ; la réponse est la même que le compte existe ou non. */
export function requestPasswordReset(email: string): Promise<{ message: string }> {
  return publicAuthRequest('/api/auth/password-reset/request', { email }, 'La demande n’a pas pu être envoyée.');
}

export function confirmPasswordReset(token: string, password: string): Promise<{ message: string; loginPath: string }> {
  return publicAuthRequest(
    '/api/auth/password-reset/confirm',
    { token, password },
    'Le mot de passe n’a pas pu être modifié.',
  );
}

/**
 * Connexion : l'API pose le cookie de session HttpOnly et renvoie le profil, conservé pour
 * l'affichage. Le JWT n'est jamais accessible au JavaScript.
 */
export async function signIn(kind: SessionKind, email: string, password: string): Promise<SessionUser> {
  const response = await apiFetch(kind === 'admin' ? '/api/auth/admin/login' : '/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const data = (await response.json().catch(() => null)) as { user?: SessionUser; message?: string } | null;
  if (!response.ok || !data?.user) {
    throw new ApiError(data?.message ?? 'Identifiants incorrects.', response.status, data);
  }
  storeSession(kind, data.user);
  return data.user;
}

/** Activation du compte : définit le mot de passe et ouvre directement la session. */
export async function activateAccount(token: string, email: string, password: string): Promise<SessionUser> {
  const response = await apiFetch('/api/auth/activate', {
    method: 'POST',
    body: JSON.stringify({ token, email, password }),
  });
  const data = (await response.json().catch(() => null)) as { user?: SessionUser; message?: string; errors?: string[] } | null;
  if (!response.ok || !data?.user) {
    const message = data?.errors?.join(' ') ?? data?.message ?? 'Une erreur est survenue lors de l’activation.';
    throw new ApiError(message, response.status, data);
  }
  storeSession(data.user.typeCompte === 'mairie' ? 'admin' : 'association', data.user);
  return data.user;
}

/** Déconnexion : l'API révoque le JWT et efface le cookie ; le profil local est supprimé dans tous les cas. */
export async function signOut(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch (error) {
    console.error('Déconnexion côté serveur impossible', error);
  } finally {
    clearSessions();
  }
}

/** Photo de profil de l'association ; le profil de session est mis à jour pour l'affichage. */
export async function uploadAssociationPhoto(file: File): Promise<AccountProfile> {
  const body = new FormData();
  body.append('photo', file);
  const profile = await accountRequest<AccountProfile>('/api/account/profile/photo', { method: 'POST', body }, 'La photo n’a pas pu être envoyée.');
  updateSessionLogo(profile.logoUrl ?? null);
  return profile;
}

export async function deleteAssociationPhoto(): Promise<AccountProfile> {
  const profile = await accountRequest<AccountProfile>('/api/account/profile/photo', { method: 'DELETE' }, 'La photo n’a pas pu être retirée.');
  updateSessionLogo(null);
  return profile;
}
