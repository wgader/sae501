const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

export type AssociationStatus = 'PENDING_VALIDATION' | 'VALIDATED' | 'REFUSED';
export type AssociationModule = 'subventions' | 'materiel' | 'salles';

export type Association = {
  id: number;
  nom: string;
  numeroRna: string;
  statut: AssociationStatus;
  permissions: AssociationModule[];
  createdAt: string | null;
};

export type AssociationPage = {
  items: Association[];
  page: number;
  itemsPerPage: number;
  totalItems: number;
};

export type Salle = {
  id: number;
  nom: string;
  description: string | null;
  adresse: string;
  capaciteMax: number;
  accesPmr: boolean;
  equipementsInclus: string[];
  createdAt: string | null;
  updatedAt: string | null;
  isActive: boolean;
  deletedAt: string | null;
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
  if (!token) {
    return redirectToAdminLogin();
  }

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

  if (response.status === 401) {
    redirectToAdminLogin();
  }

  if (!response.ok) {
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : 'Une erreur est survenue.',
      response.status,
    );
  }

  return data as T;
}

export function getAssociations(page: number, status: AssociationStatus | ''): Promise<AssociationPage> {
  const params = new URLSearchParams({ page: String(page), itemsPerPage: '10' });
  if (status) params.set('status', status);

  return request<AssociationPage>(`/api/admin/associations?${params.toString()}`);
}

export function updateAssociationStatus(
  id: number,
  status: AssociationStatus,
): Promise<Association> {
  return request<Association>(`/api/admin/associations/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export type CreateSalleInput = {
  nom: string;
  adresse: string;
  description?: string;
  capaciteMax: number;
  accesPmr: boolean;
  equipementsInclus: string[];
};

export function createSalle(input: CreateSalleInput): Promise<Salle> {
  return request<Salle>('/api/admin/salles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function getSalles(): Promise<Salle[]> {
  return request<Salle[]>('/api/admin/salles');
}

export function updateSalle(id: number, input: Partial<CreateSalleInput>): Promise<Salle> {
  return request<Salle>(`/api/admin/salles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}
