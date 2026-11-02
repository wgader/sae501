const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

export type AssociationStatus = 'PENDING_VALIDATION' | 'VALIDATED' | 'REFUSED';
export type AssociationModule = 'subventions' | 'materiel' | 'salles';

export type AssociationContact = {
  nom: string;
  prenom: string;
  nomComplet?: string;
  email: string;
  telephone: string | null;
};

export type Association = {
  id: number;
  nom: string;
  numeroRna?: string;
  statut: AssociationStatus;
  permissions: AssociationModule[];
  moduleSubventionActif?: boolean;
  moduleSalleActif?: boolean;
  moduleMaterielActif?: boolean;
  createdAt: string | null;
  contact?: AssociationContact | null;
};

export type AssociationCounts = {
  pending: number;
  validated: number;
  refused: number;
  total: number;
};

export type AssociationPage = {
  items: Association[];
  page: number;
  itemsPerPage: number;
  totalItems: number;
  counts?: AssociationCounts;
};

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

function redirectToAdminLogin(): never {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('token');
  window.location.replace('/admin');
  throw new ApiError('Redirection vers la connexion administrateur.', 401);
}

function getToken(): string {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  if (!token) return redirectToAdminLogin();
  return token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (response.status === 401) redirectToAdminLogin();
  if (!response.ok) {
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : 'Une erreur est survenue.',
      response.status,
    );
  }
  return data as T;
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

export function getAssociations(
  page: number,
  status: AssociationStatus | '',
  search?: string,
  includeCounts?: boolean,
): Promise<AssociationPage> {
  const params = new URLSearchParams({ page: String(page), itemsPerPage: '10' });
  if (status) params.set('status', status);
  if (search) params.set('q', search);
  if (includeCounts !== undefined) params.set('includeCounts', String(includeCounts));
  return request<AssociationPage>(`/api/admin/associations?${params.toString()}`);
}

export function getAssociation(id: number): Promise<Association> {
  return request<Association>(`/api/admin/associations/${id}`);
}

export function updateAssociationStatus(
  id: number,
  status: AssociationStatus,
  permissions?: AssociationModule[],
): Promise<Association> {
  const body: { status: AssociationStatus; permissions?: AssociationModule[] } = { status };
  if (permissions !== undefined) {
    body.permissions = permissions;
  }
  return request<Association>(`/api/admin/associations/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export type ExternalEventFile = {
  id: number;
  event_id?: number;
  original_name: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  sha256?: string;
};

export type ExternalEvent = {
  id: number;
  asso_id: number;
  title: string;
  location: string;
  event_type: string;
  start_date: string;
  end_time: string;
  status: string;
  created_at: string;
  files?: ExternalEventFile[];
  description?: string;
  contact_nom?: string;
  contact_email?: string;
  contact_telephone?: string;
};

export type ExternalEventListPage = {
  items: ExternalEvent[];
  page: number;
  itemsPerPage: number;
  totalItems: number;
};

export type CreateExternalEventPayload = {
  title: string;
  location: string;
  event_type: string;
  start_date: string;
  end_time: string;
};

export async function createExternalEvent(payload: CreateExternalEventPayload): Promise<ExternalEvent> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new ApiError('Vous devez être connecté avec un compte association.', 401);
  }

  const response = await fetch(`${API_URL}/api/events/external`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let message = 'Erreur lors de la déclaration de l’événement.';
    if (data?.errors && typeof data.errors === 'object') {
      message = Object.values(data.errors).join(' ');
    } else if (typeof data?.message === 'string') {
      message = data.message;
    }
    throw new ApiError(message, response.status);
  }

  return data as ExternalEvent;
}

export async function uploadExternalEventFile(eventId: number, file: File): Promise<ExternalEventFile> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new ApiError('Vous devez être connecté avec un compte association.', 401);
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/api/events/external/${eventId}/files`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : 'Erreur lors du téléversement du fichier.',
      response.status,
    );
  }

  return data as ExternalEventFile;
}

export async function getExternalEvents(page = 1, itemsPerPage = 10): Promise<ExternalEventListPage> {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  if (!token) {
    redirectToAdminLogin();
  }

  const params = new URLSearchParams({
    page: String(page),
    itemsPerPage: String(itemsPerPage),
  });

  const response = await fetch(`${API_URL}/api/events/external?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : 'Erreur lors du chargement des événements.',
      response.status,
    );
  }

  return data as ExternalEventListPage;
}

export async function getExternalEvent(id: number): Promise<ExternalEvent> {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  if (!token) {
    redirectToAdminLogin();
  }

  const response = await fetch(`${API_URL}/api/events/external/${id}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : 'Événement introuvable.',
      response.status,
    );
  }

  return data as ExternalEvent;
}

export async function updateExternalEventStatus(
  id: number,
  status: 'VALIDATED',
): Promise<ExternalEvent> {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  if (!token) {
    redirectToAdminLogin();
  }

  const response = await fetch(`${API_URL}/api/events/external/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : 'Impossible de valider l’événement.',
      response.status,
    );
  }

  return data as ExternalEvent;
}

export async function downloadExternalEventFile(fileId: number, originalName: string): Promise<void> {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  if (!token) {
    redirectToAdminLogin();
  }

  const response = await fetch(`${API_URL}/api/events/external/files/${fileId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : 'Impossible de télécharger le fichier.',
      response.status,
    );
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = originalName || `fichier-${fileId}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}