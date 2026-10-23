const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

export function getMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export type AssociationStatus = 'PENDING_VALIDATION' | 'VALIDATED' | 'REFUSED' | 'SUSPENDED';
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
  nombreMembres?: number | null;
  categorie?: string | null;
  imageUrl?: string | null;
  documents?: AssociationDocument[];
};

export type AssociationDocument = {
  id: number;
  typeDocument: string;
  fichierUrl: string;
  isVerified: boolean;
  size: number;
  originalName: string;
  mimeType: string;
  createdAt: string | null;
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

export type Salle = {
  id: number;
  nom: string;
  description: string | null;
  imageUrl: string | null;
  adresse: string;
  capaciteMax: number;
  accesPmr: boolean;
  equipementsInclus: string[];
  createdAt: string | null;
  updatedAt: string | null;
  isActive: boolean;
  deletedAt: string | null;
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
  nomAssociation?: string | null;
  typeCompte?: string | null;
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
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('token') || localStorage.getItem('admin_token'))
    : null;
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
  search?: string,
  includeCounts?: boolean,
  itemsPerPage: number = 10,
): Promise<AssociationPage> {
  const params = new URLSearchParams({ page: String(page), itemsPerPage: String(itemsPerPage) });
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
    body: JSON.stringify(body),
  });
}

export function updateAssociationModules(
  id: number,
  permissions: AssociationModule[],
): Promise<Association> {
  return request<Association>(`/api/admin/associations/${id}/modules`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissions }),
  });
}

export function deleteAssociation(id: number): Promise<void> {
  return request<void>(`/api/admin/associations/${id}`, {
    method: 'DELETE',
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
    method: data instanceof FormData ? 'POST' : 'PUT',
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

export function uploadAssociationDocument(
  associationId: number,
  file: File,
  typeDocument?: string,
  isVerified?: boolean,
): Promise<AssociationDocument> {
  const body = new FormData();
  body.append('file', file);
  if (typeDocument) body.append('typeDocument', typeDocument);
  if (isVerified !== undefined) body.append('isVerified', String(isVerified));

  return request<AssociationDocument>(`/api/admin/associations/${associationId}/documents`, {
    method: 'POST',
    body,
  });
}

export function updateAssociationDocument(
  associationId: number,
  docId: number,
  data: { typeDocument?: string; isVerified?: boolean },
): Promise<AssociationDocument> {
  return request<AssociationDocument>(`/api/admin/associations/${associationId}/documents/${docId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function deleteAssociationDocument(
  associationId: number,
  docId: number,
): Promise<void> {
  return request<void>(`/api/admin/associations/${associationId}/documents/${docId}`, {
    method: 'DELETE',
  });
}

export type CreateSalleInput = {
  nom: string;
  adresse: string;
  description?: string;
  capaciteMax: number;
  accesPmr: boolean;
  equipementsInclus: string[];
  image?: File;
};

export function createSalle(input: CreateSalleInput): Promise<Salle> {
  const body = new FormData();
  body.append('nom', input.nom);
  body.append('adresse', input.adresse);
  body.append('description', input.description || '');
  body.append('capaciteMax', String(input.capaciteMax));
  body.append('accesPmr', String(input.accesPmr));
  body.append('equipementsInclus', JSON.stringify(input.equipementsInclus));
  if (input.image) body.append('image', input.image);

  return request<Salle>('/api/admin/salles', {
    method: 'POST',
    body,
  });
}

export function getSalles(): Promise<Salle[]> {
  return request<Salle[]>('/api/admin/salles');
}

export function updateSalle(id: number, input: Partial<CreateSalleInput>): Promise<Salle> {
  if (input.image) {
    const body = new FormData();
    Object.entries(input).forEach(([key, value]) => {
      if (key === 'image' && value instanceof File) body.append(key, value);
      else if (Array.isArray(value)) body.append(key, JSON.stringify(value));
      else if (value !== undefined) body.append(key, String(value));
    });

    return request<Salle>(`/api/admin/salles/${id}`, {
      method: 'POST',
      body,
    });
  }

  return request<Salle>(`/api/admin/salles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function updateSalleStatus(id: number, isActive: boolean): Promise<Salle> {
  return request<Salle>(`/api/admin/salles/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
}

export function archiveSalle(id: number): Promise<Salle> {
  return request<Salle>(`/api/admin/salles/${id}`, {
    method: 'DELETE',
  });
}

export async function getPublicEquipment(): Promise<Equipment[]> {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('token') || localStorage.getItem('admin_token'))
    : null;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/equipment`, {
    headers,
  });
  if (!response.ok) {
    throw new ApiError('Impossible de charger le catalogue de matériel.', response.status);
  }
  return response.json();
}
