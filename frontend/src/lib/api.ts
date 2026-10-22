const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

export type AssociationStatus = 'PENDING_VALIDATION' | 'VALIDATED' | 'REFUSED';
export type AssociationModule = 'subventions' | 'materiel' | 'salles';

export type AssociationContact = {
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
};

export type Association = {
  id: number;
  nom: string;
  numeroRna?: string;
  statut: AssociationStatus;
  permissions: AssociationModule[];
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

export type Equipment = {
  id: number;
  designation: string;
  categorie: string;
  referenceInterne: string | null;
  description: string | null;
  consignesUtilisation: string | null;
  stockTotal: number;
  isArchived: boolean;
  statut: 'Disponible' | 'Archivé';
  imagePath: string | null;
  createdAt: string | null;
};

export type StockCheckResult = {
  equipmentId: number;
  currentStock: number;
  requestedStock: number;
  hasConflict: boolean;
  maxBooked: number;
  conflictingReservations: Array<{
    id: number;
    association: string;
    motif: string;
    dateRetrait: string;
    dateRestitution: string;
    quantite: number;
  }>;
};

export type StockAdjustment = {
  id: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: string;
  agent: {
    id: number | null;
    nom: string | null;
    prenom: string | null;
  };
};

export type AccountProfile = {
  id: number | null;
  email: string | null;
  telephone: string | null;
  nom: string | null;
  prenom: string | null;
};

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly data?: unknown) {
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

async function accountRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new ApiError('Vous devez être connecté pour accéder à votre profil.', 401);
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

  if (!response.ok) {
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : 'Impossible de mettre à jour le profil.',
      response.status,
      data,
    );
  }

  return data as T;
}

export function getAccountProfile(): Promise<AccountProfile> {
  return accountRequest<AccountProfile>('/api/account/profile');
}

export function updateAccountProfile(payload: {
  email?: string;
  telephone?: string | null;
}): Promise<AccountProfile> {
  return accountRequest<AccountProfile>('/api/account/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
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
): Promise<AssociationPage> {
  const params = new URLSearchParams({ page: String(page), itemsPerPage: '10' });
  if (status) params.set('status', status);
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
    body: JSON.stringify(body),
  });
}

export function getAdminEquipment(category?: string, archived?: boolean): Promise<Equipment[]> {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (archived !== undefined) params.set('archived', String(archived));
  const query = params.toString() ? `?${params.toString()}` : '';
  return request<Equipment[]>(`/api/admin/equipment${query}`);
}

export function createAdminEquipment(data: FormData | Record<string, unknown>): Promise<Equipment> {
  return request<Equipment>('/api/admin/equipment', {
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data),
  });
}

export function updateAdminEquipment(
  id: number,
  data: FormData | Record<string, unknown>,
): Promise<Equipment> {
  return request<Equipment>(`/api/admin/equipment/${id}`, {
    method: 'PUT',
    body: data instanceof FormData ? data : JSON.stringify(data),
  });
}

export function checkEquipmentStock(id: number, stockTotal: number): Promise<StockCheckResult> {
  return request<StockCheckResult>(`/api/admin/equipment/${id}/check-stock`, {
    method: 'POST',
    body: JSON.stringify({ stockTotal }),
  });
}

export function getEquipmentStockAdjustments(id: number): Promise<StockAdjustment[]> {
  return request<StockAdjustment[]>(`/api/admin/equipment/${id}/stock-adjustments`);
}

export function deleteAdminEquipment(id: number): Promise<{ message: string; equipment: Equipment }> {
  return request<{ message: string; equipment: Equipment }>(`/api/admin/equipment/${id}`, {
    method: 'DELETE',
  });
}

export async function getPublicEquipment(): Promise<Equipment[]> {
  const response = await fetch(`${API_URL}/api/equipment`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') || localStorage.getItem('admin_token') || ''}`,
    },
  });
  if (!response.ok) {
    throw new ApiError('Impossible de charger le catalogue de matériel.', response.status);
  }
  return response.json();
}