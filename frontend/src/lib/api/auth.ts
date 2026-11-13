import { accountRequest, API_URL, ApiError, redirectToAssociationLogin, requestBlob } from './client';
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
