const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

export type AssociationStatus = 'PENDING_VALIDATION' | 'VALIDATED' | 'REFUSED';
export type AssociationModule = 'evenements' | 'subventions' | 'materiel' | 'salles';

export type AdminAgent = {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  roles: string[];
  isVerified: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string | null;
};

export type AdminAgentPayload = {
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  roles: string[];
};

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

export function getAdminAgents(
  page = 1,
  search?: string,
): Promise<{
  items: AdminAgent[];
  page: number;
  itemsPerPage: number;
  totalItems: number;
}> {
  const params = new URLSearchParams({
    page: String(page),
    itemsPerPage: '50',
  });
  if (search) params.set('q', search);

  return request(`/api/admin/agents?${params.toString()}`);
}

export function createAdminAgent(payload: AdminAgentPayload): Promise<AdminAgent> {
  return request<AdminAgent>('/api/admin/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateAdminAgent(id: number, payload: Partial<AdminAgentPayload>): Promise<AdminAgent> {
  return request<AdminAgent>(`/api/admin/agents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function deleteAdminAgent(id: number): Promise<void> {
  return request<void>(`/api/admin/agents/${id}`, { method: 'DELETE' });
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